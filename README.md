## Getting Started

### 1. Install Node.js and npm

If you don't have Node.js and npm installed, download and install them from:
https://nodejs.org/

You can verify installation with:

```
node --version
npm --version
```

### 2. Install dependencies

Navigate to the project directory and run:

```
npm install
```

### 3. Configure JDBC Connections

Edit `server/jdbc-connections.json` and add your database connection strings under the appropriate `prod` and `nonProd` arrays. Example:

```
{
	"prod": [
		"jdbc:postgresql://host:port/db?user=...&password=..."
	],
	"nonProd": [
		"jdbc:sqlserver://host:port;databaseName=...;user=...;password=..."
	]
}
```

### 4. Add User-Defined Metrics (Required for ROI Calculation)

Go to the Deployment Metrics Configuration page in the dashboard and enter your organization's typical deployment metrics (deployments per quarter, lead time, deployment duration, people involved, average salary, and script failure rate). These are required for the ROI calculation to work.

### 5. Start the app

In the server folder run

node index.js

In the src folder run

npm start

### 6. Known limitations and improvements list

1. Scan a server for jdbc connections
2. Data presumes a flyway schema history table exists, so currently only works with the migrations model of flyway
