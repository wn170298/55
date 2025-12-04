// This file implements the serverless function for the /api/expenses endpoint.
// IMPORTANT: The in-memory array resets on every new deployment or function cold start.
// For persistent data, replace this with a database connection (e.g., Vercel Postgres, MongoDB Atlas).

let expenses = [
    {
        id: 1,
        amount: 50.00,
        description: "Groceries",
        category: "Food",
        date: "2023-11-29"
    },
    {
        id: 2,
        amount: 15.50,
        description: "Coffee",
        category: "Food",
        date: "2023-11-29"
    },
    {
        id: 3,
        amount: 300.00,
        description: "Rent",
        category: "Housing",
        date: "2023-12-01"
    }
];

let nextId = 4;

/**
 * Main handler for the Vercel Serverless Function.
 */
export default async function handler(req, res) {
    const { method } = req;

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    switch (method) {
        case 'GET':
            return getExpenses(res);
        case 'POST':
            return addExpense(req, res);
        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
}

// --- Handler Functions ---

function getExpenses(res) {
    // Sort expenses by date descending for better display
    const sortedExpenses = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).json(sortedExpenses);
}

async function addExpense(req, res) {
    try {
        const expenseData = await getJsonBody(req);

        const requiredFields = ['amount', 'description', 'category', 'date'];
        for (const field of requiredFields) {
            if (!expenseData[field]) {
                return res.status(400).json({
                    error: `Missing required field: ${field}`
                });
            }
        }

        const amount = parseFloat(expenseData.amount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                error: 'Amount must be a positive number'
            });
        }

        const newExpense = {
            id: nextId++,
            amount: amount.toFixed(2),
            description: expenseData.description,
            category: expenseData.category,
            date: expenseData.date
        };

        expenses.push(newExpense);

        res.status(201).json(newExpense);

    } catch (error) {
        // If JSON parsing failed
        res.status(400).json({ error: 'Invalid JSON request body' });
    }
}

/**
 * Helper function to parse the JSON body of the request.
 */
function getJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}
