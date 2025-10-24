// // src/figma-api/controllers/definitions.controller.js
// const fs = require('fs').promises;
// const path = require('path');

// class DefinitionsController {
//     constructor() {
//         this.definitionsPath = path.join(__dirname, '../definitions');
//     }

//     async getComponents(req, res) {
//         try {
//             const filePath = path.join(this.definitionsPath, 'components.json');
//             const data = await fs.readFile(filePath, 'utf8');
//             const components = JSON.parse(data);

//             res.json({
//                 success: true,
//                 data: components
//             });
//         } catch (error) {
//             console.error('Error reading components.json:', error);
//             res.status(500).json({
//                 success: false,
//                 error: 'Failed to load component definitions'
//             });
//         }
//     }

//     async getFrames(req, res) {
//         try {
//             const filePath = path.join(this.definitionsPath, 'frames.json');
//             const data = await fs.readFile(filePath, 'utf8');
//             const frames = JSON.parse(data);

//             res.json({
//                 success: true,
//                 data: frames
//             });
//         } catch (error) {
//             console.error('Error reading frames.json:', error);
//             res.status(500).json({
//                 success: false,
//                 error: 'Failed to load frame definitions'
//             });
//         }
//     }

//     async getJourneys(req, res) {
//         try {
//             const filePath = path.join(this.definitionsPath, 'journeys.json');
//             const data = await fs.readFile(filePath, 'utf8');
//             const journeys = JSON.parse(data);

//             res.json({
//                 success: true,
//                 data: journeys
//             });
//         } catch (error) {
//             console.error('Error reading journeys.json:', error);
//             res.status(500).json({
//                 success: false,
//                 error: 'Failed to load journey definitions'
//             });
//         }
//     }

//     async getAllDefinitions(req, res) {
//         try {
//             const [components, frames, journeys] = await Promise.all([
//                 fs.readFile(path.join(this.definitionsPath, 'components.json'), 'utf8'),
//                 fs.readFile(path.join(this.definitionsPath, 'frames.json'), 'utf8'),
//                 fs.readFile(path.join(this.definitionsPath, 'journeys.json'), 'utf8')
//             ]);

//             res.json({
//                 success: true,
//                 data: {
//                     components: JSON.parse(components),
//                     frames: JSON.parse(frames),
//                     journeys: JSON.parse(journeys)
//                 }
//             });
//         } catch (error) {
//             console.error('Error reading definitions:', error);
//             res.status(500).json({
//                 success: false,
//                 error: 'Failed to load definitions'
//             });
//         }
//     }
// }

// module.exports = new DefinitionsController();