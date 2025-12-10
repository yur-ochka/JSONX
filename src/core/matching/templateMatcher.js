import { parseSelector } from "../selector/parseSelector.js";
import { evalSelector } from "../selector/evalSelector.js";

export class TemplateMatcher {
  constructor(templates = []) {
    this.templates = templates.map((tpl) => ({
      ...tpl,
      compiledMatch: tpl.match ? parseSelector(tpl.match) : null,
    }));
  }

  findMatchingTemplates(node, root) {
    const matches = [];

    for (const template of this.templates) {
      if (this.doesTemplateMatch(template, node, root)) {
        matches.push(template);
      }
    }

    return matches;
  }

  doesTemplateMatch(template, node, root) {
    if (!template.compiledMatch) return false;

    try {
      // For wildcard matches, we need to check if this node would be selected
      // by the match pattern when starting from root
      const potentialMatches = evalSelector(root, template.compiledMatch);

      if (Array.isArray(potentialMatches)) {
        return potentialMatches.includes(node);
      }

      return potentialMatches === node;
    } catch (e) {
      return false;
    }
  }

  findTemplateByName(name) {
    return this.templates.find((tpl) => tpl.name === name);
  }
}
