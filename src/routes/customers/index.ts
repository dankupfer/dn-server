// src/routes/customers/index.ts
import { Router, Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import { generateCustomerWithAI } from '../../services/ai/customerGenerator';
import { CreateCustomerRequest, CustomerResponse } from '../../types';

const router = Router();

// Create synthetic customer data with AI
router.post('/create-customer', async (req: Request<{}, CustomerResponse, CreateCustomerRequest>, res: Response<CustomerResponse>) => {
  try {
    const { customerName, frescoSegment, fromDate, toDate, age, gender, profession } = req.body;

    console.log(`🦁 Creating AI-enhanced customer profile for: ${customerName}`);
    console.log(`📊 FRESCO: ${frescoSegment}, Age: ${age}, Gender: ${gender}`);

    // Validate required fields
    if (!customerName || !frescoSegment || !fromDate || !toDate || !age || !gender || !profession) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Generate unique customer ID
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🤖 Calling Claude API for realistic banking data...');

    // Generate AI-enhanced banking data
    const aiData = await generateCustomerWithAI({
      customerName,
      age,
      gender,
      profession,
      frescoSegment,
      fromDate,
      toDate
    });

    console.log(`✅ AI generated ${aiData.accounts?.length || 0} accounts and ${aiData.transactions?.length || 0} transactions`);

    // Create complete customer data
    const customerData = {
      customerId,
      profile: {
        id: customerId,
        name: customerName,
        email: `${customerName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
        age,
        gender,
        profession,
        frescoSegment
      },
      dateRange: {
        from: fromDate,
        to: toDate
      },
      accounts: aiData.accounts || [],
      transactions: aiData.transactions || [],
      createdAt: new Date().toISOString(),
      generatedBy: 'Claude AI'
    };

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'public', 'data', 'customers');
    await fs.ensureDir(dataDir);

    // Save customer data
    const filePath = path.join(dataDir, `${customerId}.json`);
    await fs.writeFile(filePath, JSON.stringify(customerData, null, 2));

    console.log(`✅ AI-enhanced customer data saved: ${filePath}`);

    res.json({
      success: true,
      message: `AI-enhanced customer "${customerName}" created with ${aiData.accounts?.length || 0} accounts and ${aiData.transactions?.length || 0} transactions`,
      customerId,
      filePath
    });

  } catch (error) {
    console.error('❌ Error creating AI-enhanced customer:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get list of customer profiles for CustomerSelector
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data', 'customers');
    
    if (!await fs.pathExists(dataDir)) {
      return res.json([]);
    }

    const files = await fs.readdir(dataDir);
    const customers = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(dataDir, file);
          const customerData = await fs.readJson(filePath);
          
          // Generate account summary
          const accountCount = customerData.accounts?.length || 0;
          const totalBalance = customerData.accounts?.reduce((sum: number, account: any) => sum + (account.balance || 0), 0) || 0;
          const accountSummary = `${accountCount} account${accountCount !== 1 ? 's' : ''}, £${totalBalance.toLocaleString()} total`;
          
          customers.push({
            id: customerData.profile.id || customerData.customerId,
            name: customerData.profile.name,
            email: customerData.profile.email || `${customerData.profile.name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
            accountSummary
          });
        } catch (fileError) {
          console.warn(`Error reading customer file ${file}:`, fileError);
        }
      }
    }

    res.json(customers);

  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    res.status(500).json([]);
  }
});

// Get specific customer data
router.get('/customers/:id/full', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filePath = path.join(process.cwd(), 'public', 'data', 'customers', `${id}.json`);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const customerData = await fs.readJson(filePath);
    res.json(customerData);

  } catch (error) {
    console.error('❌ Error fetching customer data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;