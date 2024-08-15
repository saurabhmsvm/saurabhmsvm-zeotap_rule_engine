Rule Engine with AST
A web application for managing and evaluating rules using Abstract Syntax Trees (AST). The app allows users to create rules, combine them, and evaluate them against data. Built with React.js, Node.js, and MongoDB.

Features
Create Rules: Define new rules using a simple interface.
Combine Rules: Merge multiple rules into a single rule using the most frequent operator heuristic.
Evaluate Rules: Test rules against provided data and see the results.
Manage Rules: View and manage all created rules in a list.


Tech Stack
Frontend: React.js, Tailwind CSS
Backend: Node.js, Express.js
Database: MongoDB
Library: jsep (JavaScript Expression Parser)



Setup
Prerequisites
Node.js and npm installed
MongoDB Atlas account (or local MongoDB instance)


Frontend Setup
Clone the Repository
https://github.com/saurabhmsvm/zeotap_rule_engine.git



Navigate to the frontend directory
cd client


Install Dependencies
npm install


Start the Development Server
npm start
The app should now be running on http://localhost:3000.

Backend Setup
Navigate to the backend directory
cd server


Install Dependencies
npm install


Configure MongoDB

Update the mongoURI variable in server.js with your MongoDB connection string.

Start the Server
npm start
The server should now be running on http://localhost:5000.



API Endpoints
POST /api/rules: Create a new rule
GET /api/rules: Retrieve all rules
POST /api/combine: Combine multiple rules
POST /api/evaluate: Evaluate a rule against data



Usage
Creating a Rule: Enter a rule string and submit it to create a new rule.
Combining Rules: Provide multiple rule strings to combine them into a single rule.
Evaluating a Rule: Input a rule and data to see if the rule evaluates to true or false.