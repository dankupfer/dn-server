// figma-bridge/src/controllers/figmaController.ts
import fs from 'fs';
import path from 'path';

export class FigmaController {
    private viewsPath = path.join(process.cwd(), 'src', 'figma-api', 'plugin', 'views');

    constructor() {
        console.log('🔍 FigmaController initialized');
        console.log('📁 Views path:', this.viewsPath);
        console.log('📂 Current working directory:', process.cwd());
        console.log('📂 __dirname:', __dirname);
    }

    // Read a file from the views directory
    private readView(filePath: string): string {
        const fullPath = path.join(this.viewsPath, filePath);
        console.log(`📖 Attempting to read: ${filePath}`);
        console.log(`📍 Full path: ${fullPath}`);
        console.log(`✅ File exists: ${fs.existsSync(fullPath)}`);

        if (!fs.existsSync(fullPath)) {
            console.error(`❌ File not found: ${fullPath}`);
            return `<!-- FILE NOT FOUND: ${filePath} -->`;
        }

        const content = fs.readFileSync(fullPath, 'utf-8');
        console.log(`✅ Read ${content.length} characters from ${filePath}`);
        return content;
    }

    // Render the main plugin UI
    renderPluginUI(): string {
        console.log('🎨 Starting to render plugin UI...');

        const tabs = this.readView('components/tabs.html');
        const generate = this.readView('pages/generate.html');
        const configure = this.readView('pages/configure.html');
        const exportPage = this.readView('pages/export.html');
        const styles = this.readView('styles.css');
        const script = this.readView('bundle.js');
        let html = this.readView('index.html');

        console.log('🔄 Replacing placeholders...');
        html = html.replace(/\{\{STYLES\}\}/g, styles);
        html = html.replace(/\{\{TABS\}\}/g, tabs);
        html = html.replace(/\{\{GENERATE\}\}/g, generate);
        html = html.replace(/\{\{CONFIGURE\}\}/g, configure);
        html = html.replace(/\{\{EXPORT\}\}/g, exportPage);
        html = html.replace(/\{\{SCRIPT\}\}/g, script);

        console.log('✅ HTML generated, length:', html.length);
        // console.log('📄 Final HTML preview (first 500 chars):\n', html.substring(0, 500));
        // console.log('📄 Final HTML preview (last 500 chars):\n', html.substring(html.length - 500));
        return html;
    }
}