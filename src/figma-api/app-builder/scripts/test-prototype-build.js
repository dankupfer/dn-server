// test-prototype-build.js
// Updated test script with proper fullAppConfig structure
// Run with: node test-prototype-build.js

const fetch = require('node-fetch');

// Proper fullAppConfig matching real Figma export structure
const mockConfig = {
    figmaFileId: 'test-file-123',
    figmaFileName: 'TestBankApp',
    figmaPageName: 'HomePage',
    appName: 'test-prototype',
    fullAppConfig: {
        appName: 'test-prototype',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        appFrame: {
            appName: 'test-prototype',
            brand: 'lloyds',
            mode: 'light',
            apiBase: 'http://localhost:3001'
        },
        components: [
            {
                componentName: 'Journey',
                nodeId: '1:1',
                properties: {
                    journeyOption: 'CoreJourney',
                    id: 'core-summary',
                    name: 'Summary',
                    title: 'Account Summary',
                    section_type: 'main-carousel',
                    sectionHome: true,
                    sectionHomeOption: 'summary',
                    'customer-id': 'customer-1'
                }
            },
            {
                componentName: 'Journey',
                nodeId: '1:2',
                properties: {
                    journeyOption: 'AssistJourney',
                    id: 'assist-everyday',
                    name: 'Everyday',
                    title: 'Everyday Banking',
                    section_type: 'main-carousel',
                    sectionHome: true,
                    sectionHomeOption: 'everyday',
                    tts: true,
                    gemini: true
                }
            },
            {
                componentName: 'ScreenBuilder_frame',
                nodeId: '1:3',
                properties: {
                    id: 'screenbuilder-invest',
                    section_type: 'main-carousel',
                    sectionHome: true,
                    sectionHomeOption: 'invest',
                    items: [
                        {
                            componentName: 'SectionHeader',
                            nodeId: '1:4',
                            properties: {
                                'title#1:4': 'Save & Invest'
                            }
                        },
                        {
                            componentName: 'AccountCard',
                            nodeId: '1:5',
                            properties: {
                                'title#1:5': 'Investment Account',
                                'subtitle#1:5': '12-34-56 / 12345678',
                                'balance#1:5': '£5,432.10',
                                AccountCard: 'Detailed'
                            }
                        }
                    ]
                }
            }
        ]
    }
};

async function testPrototypeBuild() {
    console.log('🚀 Starting prototype build test...\n');

    try {
        // Step 1: Start build
        console.log('📤 Step 1: Starting build...');
        const buildResponse = await fetch('http://localhost:3001/api/figma/app-builder/prototype/build', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockConfig)
        });

        const buildResult = await buildResponse.json();
        console.log('✅ Build started:', buildResult);

        if (!buildResult.jobId) {
            console.error('❌ No jobId returned!');
            return;
        }

        const jobId = buildResult.jobId;
        console.log(`\n🔄 Job ID: ${jobId}`);
        console.log('⏳ Polling for status every 5 seconds...\n');

        // Step 2: Poll for status
        let completed = false;
        let attempts = 0;
        const maxAttempts = 30; // 2.5 minutes max

        while (!completed && attempts < maxAttempts) {
            attempts++;

            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            const statusResponse = await fetch(`http://localhost:3001/api/figma/app-builder/prototype/status/${jobId}`);
            const status = await statusResponse.json();

            console.log(`[Attempt ${attempts}] Status: ${status.status} | Progress: ${status.progress}% | ${status.currentStep}`);

            if (status.status === 'complete') {
                completed = true;
                console.log('\n✅ Build completed successfully!');
                console.log(`\n🌐 Prototype URL: ${status.result.prototypeUrl}`);
                console.log(`⏱️  Build time: ${status.result.buildTime}s`);
                console.log(`\n👀 Open in browser: ${status.result.prototypeUrl}`);
            } else if (status.status === 'error') {
                console.error('\n❌ Build failed!');
                console.error('Error:', status.error);
                console.error('Error code:', status.errorCode);
                return;
            }
        }

        if (!completed) {
            console.error('\n⏰ Build timed out after 2.5 minutes');
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run test
testPrototypeBuild();