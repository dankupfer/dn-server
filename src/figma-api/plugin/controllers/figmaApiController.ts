// src/figma-api/controllers/figmaApiController.ts
// API endpoints for form building and conditional logic
// Separate from figmaController.ts which handles UI rendering

import { Request, Response } from 'express';
import formBuilderService from '../services/formBuilder.service';

/**
 * POST /api/figma/plugin/form-config
 * Generic form configuration endpoint - works for ANY component
 */
export const getFormConfig = async (req: Request, res: Response) => {
    try {
        const { componentName, currentValues, selectedConfiguration } = req.body;

        if (!componentName) {
            return res.status(400).json({ 
                error: 'componentName is required' 
            });
        }

        // Build form using generic service
        const formConfig = formBuilderService.buildForm(
            componentName,
            currentValues,
            selectedConfiguration
        );

        if (!formConfig) {
            return res.status(404).json({ 
                error: `No definition found for component: ${componentName}` 
            });
        }

        console.log('✅ Form config built successfully');
        res.json(formConfig);

    } catch (error) {
        console.error('❌ Error building form config:', error);
        res.status(500).json({ 
            error: 'Failed to build form configuration',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * POST /api/figma/plugin/conditional-rules
 * Evaluate conditional rules and return affected fields
 */
export const getConditionalRules = async (req: Request, res: Response) => {
    try {
        const { componentName, changedFieldKey, currentValues } = req.body;

        if (!componentName || !currentValues) {
            return res.status(400).json({ 
                error: 'componentName and currentValues are required' 
            });
        }

        const affectedFields: any[] = [];

        // Get component definition
        const definition = formBuilderService.getComponentDefinition(componentName);
        if (!definition) {
            return res.status(404).json({ 
                error: `No definition found for component: ${componentName}` 
            });
        }

        // Get all fields to check
        let allFields: any[] = [];
        if (definition.fields) {
            allFields = definition.fields;
        } else if (definition.commonFields) {
            allFields = [...definition.commonFields];
            // Add variant-specific fields if applicable
            if (definition.configurations && currentValues.journeyOption) {
                const variantDef = definition.configurations[currentValues.journeyOption];
                if (variantDef) {
                    allFields.push(...variantDef.fields);
                }
            }
        }

        // Check each field for conditional rules
        for (const field of allFields) {
            const fieldState: any = {
                key: field.key
            };

            // Check if field should be disabled/hidden
            const rules = formBuilderService.evaluateConditionalRules(
                field.key,
                currentValues,
                componentName
            );

            if (rules.disabled !== undefined) {
                fieldState.disabled = rules.disabled;
            }
            if (rules.hidden !== undefined) {
                fieldState.hidden = rules.hidden;
            }

            // Check if field has a conditional field (like sectionHome checkbox)
            if (field.conditionalField) {
                const showConditional = evaluateShowCondition(
                    field.conditionalField.showWhen,
                    currentValues
                );

                fieldState.showConditionalField = showConditional;

                // Get options for the conditional dropdown
                if (showConditional && field.conditionalField.optionsFrom) {
                    const parentValue = currentValues[field.conditionalField.optionsFrom];
                    const options = field.conditionalField.optionsMap?.[parentValue] || [];
                    
                    fieldState.conditionalOptions = options;
                    fieldState.savedConditionalValue = currentValues.sectionHomeOption;
                }
            }

            // Only include fields that have state changes
            if (Object.keys(fieldState).length > 1) {
                affectedFields.push(fieldState);
            }
        }

        console.log('✅ Conditional rules evaluated:', affectedFields.length, 'fields affected');
        res.json({ affectedFields });

    } catch (error) {
        console.error('❌ Error evaluating conditional rules:', error);
        res.status(500).json({ 
            error: 'Failed to evaluate conditional rules',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * POST /api/figma/conditional-options
 * Get options for a conditional field based on parent field value
 */
export const getConditionalOptions = async (req: Request, res: Response) => {
    try {
        const { componentName, fieldKey, dependentFieldKey, dependentFieldValue } = req.body;

        if (!componentName || !fieldKey || !dependentFieldKey) {
            return res.status(400).json({ 
                error: 'componentName, fieldKey, and dependentFieldKey are required' 
            });
        }

        const options = formBuilderService.getConditionalOptions(
            fieldKey,
            dependentFieldValue,
            componentName
        );

        console.log('✅ Conditional options:', options);
        res.json(options);

    } catch (error) {
        console.error('❌ Error getting conditional options:', error);
        res.status(500).json({ 
            error: 'Failed to get conditional options',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * GET /api/figma/plugin/definitions/components
 * Get all component definitions
 */
export const getComponentDefinitions = async (req: Request, res: Response) => {
    try {
        const definitions = formBuilderService.getComponentDefinitions();
        res.json(definitions);
    } catch (error) {
        console.error('❌ Error getting component definitions:', error);
        res.status(500).json({ 
            error: 'Failed to get component definitions',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * GET /api/figma/plugin/definitions/configurations/:componentName
 * Get available configurations for a component (e.g., Journey options)
 */
export const getComponentConfigurations = async (req: Request, res: Response) => {
    try {
        const { componentName } = req.params;
        const configurations = formBuilderService.getAvailableConfigurations(componentName);
        res.json(configurations);
    } catch (error) {
        console.error('❌ Error getting component variants:', error);
        res.status(500).json({ 
            error: 'Failed to get component variants',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Helper: Evaluate show/hide conditions
 */
function evaluateShowCondition(
    showWhen: Record<string, any> | undefined,
    currentValues: Record<string, any>
): boolean {
    if (!showWhen) return false;

    // Check all conditions (AND logic)
    for (const [fieldKey, expectedValue] of Object.entries(showWhen)) {
        if (currentValues[fieldKey] !== expectedValue) {
            return false;
        }
    }

    return true;
}

/**
 * Legacy endpoint for backward compatibility
 * GET /api/figma/plugin/definitions/journeys
 */
export const getJourneyOptions = async (req: Request, res: Response) => {
    try {
        const configurations = formBuilderService.getAvailableConfigurations('Journey');
        res.json(configurations);
    } catch (error) {
        console.error('❌ Error getting journey options:', error);
        res.status(500).json({ 
            error: 'Failed to get journey options',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};