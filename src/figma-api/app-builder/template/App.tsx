// ====== DN-STARTER TEMPLATE =======

import React from 'react';
import appConfigData from './src/config/appConfig.json';
import { AppConfig, TemplateKey } from './src/config/appConfig.types';

// Static imports for all templates - now from apps folder
import AppBasic from './App.basic';
import AppAuth from './App.auth';
import AppFull from './App.full';
import AppSummary from './App.summary';
import AppAssist from './App.assist';
import AppFigma from './App.figma';

// Type assertion for the imported JSON
const appConfig = appConfigData as unknown as AppConfig;

const App: React.FC = () => {
  const selectedTemplate: TemplateKey = appConfig.selectedTemplate;
  const templateConfig = appConfig.availableTemplates[selectedTemplate];

  if (!templateConfig) {
    console.error(`Template "${selectedTemplate}" not found in appConfig.json`);
    console.error('Available templates:', Object.keys(appConfig.availableTemplates));
    throw new Error(`Invalid template: ${selectedTemplate}`);
  }

  console.log(`Loading template: ${templateConfig.name} (${templateConfig.entryPoint})`);

  // Map template keys to components
  const getTemplateComponent = (): React.FC => {
    switch (selectedTemplate) {
      case 'basic':
        return AppBasic;
      case 'auth':
        return AppAuth;
      case 'full':
        return AppFull;
      case 'summary':
        return AppSummary;
      case 'assist':
        return AppAssist;
      case 'figma':
        return AppFigma;
      default:
        throw new Error(`Unknown template: ${selectedTemplate}`);
    }
  };

  const TemplateComponent = getTemplateComponent();
  return (
    <TemplateComponent />
  );
};

export default App;





// ====== HELLO WORLD =======

// import React from 'react';
// import { Text, View, StyleSheet } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>Hello World!! 👋</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   text: {
//     fontSize: 24,
//     fontWeight: 'bold'
//   }
// });



// ====== WEBVIEW =======

// import React, { useState } from 'react';
// import { View, TextInput, TouchableOpacity, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
// import { WebView } from 'react-native-webview';

// export default function App() {
//   const [url, setUrl] = useState('');
//   const [currentUrl, setCurrentUrl] = useState('');

//   const handleSubmit = () => {
//     // Add https:// if not present
//     let finalUrl = url.trim();
//     if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
//       finalUrl = 'https://' + finalUrl;
//     }
//     setCurrentUrl(finalUrl);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         style={styles.container}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         <View style={styles.inputContainer}>
//           <TextInput
//             style={styles.input}
//             placeholder="Enter URL (e.g., bbc.co.uk)"
//             value={url}
//             onChangeText={setUrl}
//             onSubmitEditing={handleSubmit}
//             autoCapitalize="none"
//             autoCorrect={false}
//             keyboardType="url"
//           />
//           <TouchableOpacity style={styles.button} onPress={handleSubmit}>
//             <Text style={styles.buttonText}>Go</Text>
//           </TouchableOpacity>
//         </View>

//         {currentUrl ? (
//           <WebView
//             source={{ uri: currentUrl }}
//             style={styles.webview}
//           />
//         ) : (
//           <View style={styles.placeholder}>
//             <Text style={styles.placeholderText}>Enter a URL above to start browsing</Text>
//           </View>
//         )}
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   input: {
//     flex: 1,
//     height: 40,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginRight: 10,
//   },
//   button: {
//     backgroundColor: '#006a4e',
//     paddingHorizontal: 20,
//     justifyContent: 'center',
//     borderRadius: 5,
//   },
//   buttonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   webview: {
//     flex: 1,
//   },
//   placeholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   placeholderText: {
//     color: '#999',
//     fontSize: 16,
//   },
// });



