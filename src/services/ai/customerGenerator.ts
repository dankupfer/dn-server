// src/services/ai/customerGenerator.ts
import { CustomerProfile } from '../../types';

interface ClaudeResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
}

export async function generateCustomerWithAI(profile: CustomerProfile) {
  // Calculate months between dates
  const fromDate = new Date(profile.fromDate);
  const toDate = new Date(profile.toDate);
  const months = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  // Calculate realistic transaction count based on FRESCO segment and months
  let transactionsPerMonth;
  switch (profile.frescoSegment) {
    case 'A':
    case 'B':
      transactionsPerMonth = 50; // Higher income, more transactions
      break;
    case 'C1':
    case 'C2':
      transactionsPerMonth = 35; // Middle income
      break;
    case 'D':
    case 'E':
      transactionsPerMonth = 25; // Lower income, fewer transactions
      break;
    default:
      transactionsPerMonth = 35;
  }

  const totalTransactions = months * transactionsPerMonth;

  const prompt = `You are helping create synthetic test data for a banking application development project. This is for software testing and UI development, not real financial data.

Generate realistic but fictional UK banking test data for application testing:

Customer Profile: ${profile.customerName} (fictional character)
Demographics: Age ${profile.age}, ${profile.gender}, ${profile.profession}
Socioeconomic: FRESCO segment ${profile.frescoSegment}
Test Period: ${profile.fromDate} to ${profile.toDate}

For software testing purposes, generate ${totalTransactions} fictional transactions across ${months} months:

Requirements for test data:
- 2-4 fictional bank accounts with test balances
- Monthly test transactions: salary, utilities, groceries, fuel
- Use common UK merchant names (Tesco, Sainsbury, Shell, Costa)
- Spread evenly across the date range for testing
- Realistic amounts appropriate for the demographic segment

This synthetic data is for:
- Testing mobile banking app UI components
- Demonstrating data visualization features  
- Software development and prototyping

Generate complete JSON test dataset:

{"accounts":[{"id":"acc_1","type":"current","name":"Test Current Account","accountNumber":"12-34-56/12345678","balance":1250.45,"sortCode":"30-95-74"}],"transactions":[{"id":"txn_1","accountId":"acc_1","date":"${profile.fromDate}","description":"Test Salary Payment","amount":2500.00,"type":"credit","category":"salary"}]}`;

  console.log('🚀 Generating customer data with Claude...');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY || '',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Claude API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody
    });
    throw new Error(`Claude API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json() as ClaudeResponse;

  // Clean the response text to extract only JSON
  let responseText = data.content[0].text;

  // Find the JSON object by looking for the first { and last }
  const firstBrace = responseText.indexOf('{');
  const lastBrace = responseText.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No valid JSON found in Claude response');
  }

  // Extract only the JSON portion
  const jsonOnly = responseText.slice(firstBrace, lastBrace + 1);

  console.log('✅ Customer data generated successfully');

  return JSON.parse(jsonOnly);
}