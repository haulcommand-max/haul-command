
import * as cheerio from 'cheerio';

export interface ExtractionRule {
    selector: string;
    attribute?: string; // If null, get text
    regex?: string; // Optional regex to extract specific part
    transform?: 'trim' | 'lowercase' | 'uppercase' | 'date' | 'number';
}

export interface PageSchema {
    containerSelector?: string; // If present, we return an array of items. If null, single object.
    fields: Record<string, ExtractionRule>;
}

export interface ParseResult {
    success: boolean;
    data: any | any[];
    error?: string;
    itemCount: number;
}

export class ContentParser {

    parse(html: string, schema: PageSchema): ParseResult {
        try {
            const $ = cheerio.load(html);

            if (schema.containerSelector) {
                // List Mode
                const items: any[] = [];
                $(schema.containerSelector).each((_, element) => {
                    const item = this.extractFields($, $(element), schema.fields);
                    // Filter out empty items if needed
                    if (Object.keys(item).length > 0) {
                        items.push(item);
                    }
                });
                return { success: true, data: items, itemCount: items.length };
            } else {
                // Single Item/Page Mode
                const data = this.extractFields($, $('body'), schema.fields);
                return { success: true, data: data, itemCount: 1 };
            }

        } catch (err: any) {
            return {
                success: false,
                data: null,
                error: err.message,
                itemCount: 0
            };
        }
    }

    private extractFields($: cheerio.CheerioAPI, context: cheerio.Cheerio<any>, fields: Record<string, ExtractionRule>): any {
        const result: any = {};

        for (const [key, rule] of Object.entries(fields)) {
            let el = context.find(rule.selector);
            if (context.is(rule.selector)) el = context; // Handle case where context IS the selector

            let value: string | undefined;

            if (rule.attribute) {
                value = el.attr(rule.attribute);
            } else {
                value = el.text();
            }

            if (value === undefined || value === null) continue;

            // Apply transformations
            if (rule.regex) {
                const match = new RegExp(rule.regex).exec(value);
                if (match && match[1]) {
                    value = match[1];
                }
            }

            if (rule.transform) {
                switch (rule.transform) {
                    case 'trim': value = value.trim(); break;
                    case 'lowercase': value = value.toLowerCase(); break;
                    case 'uppercase': value = value.toUpperCase(); break;
                    case 'number':
                        const num = parseFloat(value.replace(/[^0-9.-]+/g, ""));
                        result[key] = isNaN(num) ? 0 : num;
                        continue; // Skip the default assignment
                }
            } else {
                value = value.trim();
            }

            result[key] = value;
        }
        return result;
    }
}
