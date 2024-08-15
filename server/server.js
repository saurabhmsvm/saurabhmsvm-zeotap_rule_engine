const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jsep = require('jsep'); // Ensure jsep is required

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB Atlas connection string
const mongoURI = 'mongodb+srv://zeotap:zeotap@cluster0.vjvmn2h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// AST Schema
const astSchema = new mongoose.Schema({
  type: String, // 'operator' or 'operand'
  value: String, // e.g., number for comparisons or operator
  left: { type: mongoose.Schema.Types.Mixed, default: null },
  right: { type: mongoose.Schema.Types.Mixed, default: null },
});

const ruleSchema = new mongoose.Schema({
  rule_string: String,
  ast: astSchema,
});

const Rule = mongoose.model('Rule', ruleSchema);

// Function to parse rule string to AST
const parseRule = (ruleString) => {
  try {
    // Normalize rule string by replacing logical operators and equality operator
    const normalizedRule = ruleString
      .replace(/\bAND\b/g, '&&')
      .replace(/\bOR\b/g, '||')
      .replace(/=(?![=])/g, '=='); // Replace single '=' with '=='
    
    // Parse the normalized rule string
    const expression = jsep(normalizedRule);
    return parseExpression(expression);
  } catch (error) {
    console.error('Error parsing rule string:', error);
    throw new Error('Invalid rule string');
  }
};

// Convert JSEP expression to AST format used in your application
const parseExpression = (expression) => {
  switch (expression.type) {
    case 'BinaryExpression':
      return {
        type: 'operator',
        value: expression.operator,
        left: parseExpression(expression.left),
        right: parseExpression(expression.right),
      };
    case 'UnaryExpression':
      return {
        type: 'operator',
        value: expression.operator,
        left: parseExpression(expression.argument),
        right: null,
      };
    case 'Literal':
      return {
        type: 'operand',
        value: expression.value.toString(),
        left: null,
        right: null,
      };
    case 'Identifier':
      return {
        type: 'operand',
        value: expression.name,
        left: null,
        right: null,
      };
    default:
      throw new Error(`Unsupported expression type: ${expression.type}`);
  }
};



const evaluateRule = (ast, data) => {
  switch (ast.type) {
    case 'operator':
      // Recursively evaluate left and right subtrees
      const leftValue = evaluateRule(ast.left, data);
      const rightValue = evaluateRule(ast.right, data);

      // Apply the operator
      switch (ast.value) {
        case '&&':
          return leftValue && rightValue;
        case '||':
          return leftValue || rightValue;
        case '>':
          return leftValue > rightValue;
        case '>=':
          return leftValue >= rightValue;
        case '<':
          return leftValue < rightValue;
        case '<=':
          return leftValue <= rightValue;
        case '==':
        case '===':
          return leftValue === rightValue;
        case '!=':
        case '!==':
          return leftValue !== rightValue;
        default:
          throw new Error(`Unsupported operator: ${ast.value}`);
      }

    case 'operand':
      // Return the value from the data if it's an identifier, otherwise return the literal value
      return isNaN(ast.value) ? data[ast.value] : parseFloat(ast.value);

    default:
      throw new Error(`Unsupported AST node type: ${ast.type}`);
  }
};


// Combine multiple ASTs into one using most frequent operator heuristic
const combineRules = (rules) => {
  if (rules.length === 0) {
    throw new Error('No rules provided for combination');
  }

  // Parse all rules into ASTs
  const asts = rules.map(rule => parseRule(rule));

  // Count occurrences of each operator
  const operatorCounts = asts.reduce((counts, ast) => {
    const countOperators = (node) => {
      if (node.type === 'operator') {
        counts[node.value] = (counts[node.value] || 0) + 1;
        countOperators(node.left);
        countOperators(node.right);
      }
    };
    countOperators(ast);
    return counts;
  }, {});

  // Determine the most frequent operator
  const mostFrequentOperator = Object.keys(operatorCounts).reduce((a, b) => operatorCounts[a] > operatorCounts[b] ? a : b);

  // Combine ASTs using the most frequent operator
  return asts.reduce((acc, ast) => {
    return {
      type: 'operator',
      value: mostFrequentOperator,
      left: acc,
      right: ast,
    };
  });
};

// Create a new rule
app.post('/api/rules', async (req, res) => {
  try {
    const { rule_string } = req.body;
    const ast = parseRule(rule_string);
    const rule = new Rule({ rule_string, ast });
    await rule.save();
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: 'Error saving rule' });
  }
});

// Get all rules
app.get('/api/rules', async (req, res) => {
  try {
    const rules = await Rule.find();
    res.status(200).json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching rules' });
  }
});

// Combine rules endpoint
app.post('/api/combine', async (req, res) => {
  try {
    const { rule_strings } = req.body;
    const combinedAst = combineRules(rule_strings);
    const combinedRuleString = `Combined Rule(${rule_strings.join(', ')})`;
    const rule = new Rule({ rule_string: combinedRuleString, ast: combinedAst });
    await rule.save();
    res.status(200).json({ rule_string: combinedRuleString, ast: combinedAst });
  } catch (error) {
    res.status(500).json({ error: 'Error combining rules' });
  }
});


app.post('/api/evaluate', (req, res) => {
  try {
    const { ast, data } = req.body;
    const result = evaluateRule(ast, data);
    res.status(200).json({ result });
  } catch (error) {
    console.error('Error evaluating rule:', error);
    res.status(500).json({ error: 'Error evaluating rule' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
