const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

class HelpSystem {
  constructor() {
    this.commands = new Map();
    this.categories = new Map();
    this.initializeCommands();
  }
  
  initializeCommands() {
    // Core System Commands
    this.addCommand('help', {
      category: 'system',
      description: 'Show help information',
      usage: 'help [command]',
      examples: [
        'help',
        'help emotions',
        'help cache'
      ],
      details: 'Get help for all commands or specific command information.'
    });
    
    this.addCommand('state', {
      category: 'system',
      description: 'Show current system state',
      usage: 'state',
      examples: ['state', 'status'],
      details: 'Display comprehensive system state including session info, cognitive state, and performance metrics.'
    });
    
    this.addCommand('analyze', {
      category: 'system',
      description: 'Analyze conversation and user patterns',
      usage: 'analyze',
      examples: ['analyze', 'satisfaction'],
      details: 'Perform satisfaction analysis and show user interaction patterns.'
    });
    
    // Emotion System Commands
    this.addCommand('emotions', {
      category: 'emotion',
      description: 'Show current emotion state and statistics',
      usage: 'emotions',
      examples: ['emotions', 'emotion'],
      details: 'Display current emotion, intensity, confidence, history, and emotional statistics.'
    });
    
    this.addCommand('emotion reset', {
      category: 'emotion',
      description: 'Reset emotion system to neutral',
      usage: 'emotion reset',
      examples: ['emotion reset'],
      details: 'Manually reset the emotion system to neutral state.'
    });
    
    this.addCommand('emotion response', {
      category: 'emotion',
      description: 'Generate emotional response based on current state',
      usage: 'emotion response',
      examples: ['emotion response'],
      details: 'Generate an emotional response and show style modifiers based on current emotional state.'
    });
    
    // Cache System Commands
    this.addCommand('cache', {
      category: 'cache',
      description: 'Show response cache statistics',
      usage: 'cache',
      examples: ['cache', 'cache stats'],
      details: 'Display cache statistics including hit rate, size, and top cached responses.'
    });
    
    this.addCommand('cache clear', {
      category: 'cache',
      description: 'Clear all cached responses',
      usage: 'cache clear',
      examples: ['cache clear'],
      details: 'Remove all cached responses from memory and disk.'
    });
    
    this.addCommand('cache entries', {
      category: 'cache',
      description: 'Show recent cache entries',
      usage: 'cache entries',
      examples: ['cache entries'],
      details: 'Display recent cached responses with details.'
    });
    
    // Multi-Agent System Commands
    this.addCommand('agents', {
      category: 'multi-agent',
      description: 'List active multi-agent system agents',
      usage: 'agents',
      examples: ['agents'],
      details: 'Show all active agents with their roles and current tasks.'
    });
    
    this.addCommand('create agent', {
      category: 'multi-agent',
      description: 'Create a new agent',
      usage: 'create agent <id> <role> [capabilities...]',
      examples: [
        'create agent researcher analyst',
        'create agent coder programming debugging',
        'create agent writer creative storytelling'
      ],
      details: 'Create a new agent with specified ID, role, and optional capabilities.'
    });
    
    this.addCommand('workflows', {
      category: 'multi-agent',
      description: 'List available workflows',
      usage: 'workflows',
      examples: ['workflows'],
      details: 'Show all available multi-agent workflows with descriptions.'
    });
    
    this.addCommand('run workflow', {
      category: 'multi-agent',
      description: 'Execute a workflow',
      usage: 'run workflow <workflow_id> [param:value ...]',
      examples: [
        'run workflow code_review',
        'run workflow research topic:AI',
        'run workflow problem_solving problem:"solve equation"'
      ],
      details: 'Execute a multi-agent workflow with optional parameters.'
    });
    
    // Internal Agent System Commands
    this.addCommand('internal agents', {
      category: 'internal',
      description: 'Show internal agent system status',
      usage: 'internal agents',
      examples: ['internal agents'],
      details: 'Display internal agent system status and active internal agents.'
    });
    
    this.addCommand('init internal system', {
      category: 'internal',
      description: 'Initialize internal agent system',
      usage: 'init internal system',
      examples: ['init internal system'],
      details: 'Initialize specialized internal agents for different functions.'
    });
    
    this.addCommand('process internal', {
      category: 'internal',
      description: 'Process input through internal agent system',
      usage: 'process internal <input>',
      examples: [
        'process internal analyze this data',
        'process internal change my name to Alex',
        'process internal what should I do next?'
      ],
      details: 'Process user input through internal agent system for specialized handling.'
    });
    
    // Identity and Personality Commands
    this.addCommand('goal:', {
      category: 'identity',
      description: 'Set a manual goal',
      usage: 'goal: <goal description>',
      examples: [
        'goal: learn about machine learning',
        'goal: help with coding project',
        'goal: be more creative'
      ],
      details: 'Set a specific goal for the AI to focus on.'
    });
    
    this.addCommand('reward:', {
      category: 'identity',
      description: 'Give a reward with reason',
      usage: 'reward: <reason>',
      examples: [
        'reward: good explanation',
        'reward: helpful response',
        'reward: creative solution'
      ],
      details: 'Give positive reinforcement to the AI with a specific reason.'
    });
    
    // System Control Commands
    this.addCommand('sleep', {
      category: 'system',
      description: 'Put the AI into sleep mode',
      usage: 'sleep',
      examples: ['sleep'],
      details: 'Put the AI into sleep mode to reduce processing.'
    });
    
    this.addCommand('wake', {
      category: 'system',
      description: 'Wake the AI from sleep mode',
      usage: 'wake',
      examples: ['wake'],
      details: 'Wake the AI from sleep mode to resume normal operation.'
    });
    
    this.addCommand('shutdown', {
      category: 'system',
      description: 'Shutdown the AI system',
      usage: 'shutdown',
      examples: ['shutdown'],
      details: 'Safely shutdown the AI system.'
    });
    
    // Identity Change Commands
    this.addCommand('change name', {
      category: 'identity',
      description: 'Change the AI\'s name',
      usage: 'change your name to <name>',
      examples: [
        'change your name to Alex',
        'your name is now Sarah',
        'call yourself Max'
      ],
      details: 'Change the AI\'s identity name and associated traits.'
    });
    
    // Central Brain Commands
    this.addCommand('brain', {
      category: 'cerebrum',
      description: 'Show Central Brain (CEREBRUM) status and sub-agents',
      usage: 'brain',
      examples: ['brain', 'central brain'],
      details: 'Display CEREBRUM identity, specialized sub-agents, decision thresholds, and system state.'
    });
    
    this.addCommand('process through brain', {
      category: 'cerebrum',
      description: 'Route input through Central Brain orchestration',
      usage: 'process through brain <input>',
      examples: [
        'process through brain Hello, how are you?',
        'process through brain Analyze my performance',
        'process through brain Change my name to Alex'
      ],
      details: 'Send input through CEREBRUM for intelligent processing with specialist delegation when needed.'
    });
    
    this.addCommand('clean memory', {
      category: 'cerebrum',
      description: 'Clear all memory and start fresh',
      usage: 'clean memory',
      examples: ['clean memory', 'clear memory'],
      details: 'Completely wipe all memory, logs, cache, and state. Creates a fresh start.'
    });

    // Organize commands by category
    this.organizeByCategory();
  }
  
  addCommand(name, details) {
    this.commands.set(name.toLowerCase(), {
      name: name,
      ...details
    });
  }
  
  organizeByCategory() {
    for (const [name, command] of this.commands.entries()) {
      if (!this.categories.has(command.category)) {
        this.categories.set(command.category, []);
      }
      this.categories.get(command.category).push(command);
    }
  }
  
  /**
   * Get help for a specific command
   * @param {string} commandName - Name of the command
   * @returns {Object|null} Command details or null if not found
   */
  getCommand(commandName) {
    return this.commands.get(commandName.toLowerCase()) || null;
  }
  
  /**
   * Get all commands in a category
   * @param {string} category - Category name
   * @returns {Array} Array of commands in the category
   */
  getCategory(category) {
    return this.categories.get(category) || [];
  }
  
  /**
   * Get all available categories
   * @returns {Array} Array of category names
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }
  
  /**
   * Search for commands matching a query
   * @param {string} query - Search query
   * @returns {Array} Array of matching commands
   */
  search(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const [name, command] of this.commands.entries()) {
      if (
        name.includes(queryLower) ||
        command.description.toLowerCase().includes(queryLower) ||
        command.details.toLowerCase().includes(queryLower)
      ) {
        results.push(command);
      }
    }
    
    return results;
  }
  
  /**
   * Display help for a specific command
   * @param {string} commandName - Name of the command
   */
  displayCommandHelp(commandName) {
    const command = this.getCommand(commandName);
    
    if (!command) {
      console.log(chalk.red(`❌ Command '${commandName}' not found.`));
      console.log(chalk.yellow('💡 Try: help search <term> to find related commands'));
      return;
    }
    
    console.log(chalk.blue.bold(`\n📖 HELP: ${command.name.toUpperCase()}`));
    console.log(chalk.white(`Description: ${command.description}`));
    console.log(chalk.gray(`Category: ${command.category}`));
    console.log(chalk.cyan(`Usage: ${command.usage}`));
    
    if (command.examples && command.examples.length > 0) {
      console.log(chalk.yellow.bold('\n💡 Examples:'));
      command.examples.forEach(example => {
        console.log(chalk.green(`  ${example}`));
      });
    }
    
    if (command.details) {
      console.log(chalk.white.bold('\n📋 Details:'));
      console.log(chalk.gray(command.details));
    }
  }
  
  /**
   * Display help for a category
   * @param {string} categoryName - Name of the category
   */
  displayCategoryHelp(categoryName) {
    const commands = this.getCategory(categoryName);
    
    if (commands.length === 0) {
      console.log(chalk.red(`❌ Category '${categoryName}' not found.`));
      return;
    }
    
    console.log(chalk.blue.bold(`\n📂 ${categoryName.toUpperCase()} COMMANDS:`));
    
    commands.forEach(command => {
      console.log(chalk.white(`• ${command.name}`));
      console.log(chalk.gray(`  ${command.description}`));
      console.log(chalk.cyan(`  Usage: ${command.usage}`));
      
      if (command.examples && command.examples.length > 0) {
        console.log(chalk.green(`  Example: ${command.examples[0]}`));
      }
      console.log();
    });
  }
  
  /**
   * Display general help overview
   */
  displayOverview() {
    console.log(chalk.blue.bold('\n🚀 NEVERSLEEP.AI HELP SYSTEM'));
    console.log(chalk.white('Welcome to the interactive help system!'));
    console.log(chalk.gray('Get help for specific commands or explore different categories.\n'));
    
    console.log(chalk.yellow.bold('📚 QUICK COMMANDS:'));
    console.log(chalk.green('  help <command>     - Get help for a specific command'));
    console.log(chalk.green('  help <category>    - Show all commands in a category'));
    console.log(chalk.green('  help search <term> - Search for commands'));
    console.log(chalk.green('  help commands      - List all available commands'));
    console.log(chalk.green('  help categories    - Show all categories'));
    
    console.log(chalk.cyan.bold('\n🗂️ COMMAND CATEGORIES:'));
    
    const categoryDescriptions = {
      system: 'Core system commands and status',
      cerebrum: 'Central Brain (CEREBRUM) orchestration and control',
      emotion: 'Emotion tracking and analysis',
      cache: 'Response caching system',
      'multi-agent': 'Multi-agent workflows and management',
      internal: 'Internal agent system commands',
      identity: 'Identity and personality management'
    };
    
    for (const category of this.getCategories()) {
      const commands = this.getCategory(category);
      const description = categoryDescriptions[category] || 'Various commands';
      console.log(chalk.white(`  ${category.padEnd(12)} - ${description} (${commands.length} commands)`));
    }
    
    console.log(chalk.magenta.bold('\n🔍 GETTING STARTED:'));
    console.log(chalk.gray('• Try "help system" to see core system commands'));
    console.log(chalk.gray('• Try "help cerebrum" to learn about Central Brain control'));
    console.log(chalk.gray('• Try "help emotion" to learn about emotion tracking'));
    console.log(chalk.gray('• Try "help multi-agent" to explore multi-agent workflows'));
    console.log(chalk.gray('• Try "help search ai" to find AI-related commands'));
    
    console.log(chalk.green.bold('\n✨ TIPS:'));
    console.log(chalk.gray('• All user input is processed through CEREBRUM (Central Brain)'));
    console.log(chalk.gray('• CEREBRUM decides when to use specialist agents automatically'));
    console.log(chalk.gray('• Use "brain" to see CEREBRUM status and sub-agents'));
    console.log(chalk.gray('• Use "clean memory" for a completely fresh start'));
    console.log(chalk.gray('• Commands are case-insensitive and have multiple aliases'));
  }
  
  /**
   * Display all available commands
   */
  displayAllCommands() {
    console.log(chalk.blue.bold('\n📋 ALL AVAILABLE COMMANDS:'));
    
    const sortedCommands = Array.from(this.commands.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    sortedCommands.forEach(command => {
      console.log(chalk.white(`• ${command.name}`));
      console.log(chalk.gray(`  ${command.description}`));
    });
    
    console.log(chalk.cyan(`\nTotal: ${sortedCommands.length} commands available`));
  }
  
  /**
   * Display search results
   * @param {string} query - Search query
   */
  displaySearchResults(query) {
    const results = this.search(query);
    
    if (results.length === 0) {
      console.log(chalk.red(`❌ No commands found matching '${query}'`));
      console.log(chalk.yellow('💡 Try searching for: system, emotion, cache, agent, or identity'));
      return;
    }
    
    console.log(chalk.blue.bold(`\n🔍 SEARCH RESULTS FOR '${query.toUpperCase()}' (${results.length} found):`));
    
    results.forEach(command => {
      console.log(chalk.white(`• ${command.name}`));
      console.log(chalk.gray(`  ${command.description}`));
      console.log(chalk.cyan(`  Usage: ${command.usage}`));
      
      if (command.examples && command.examples.length > 0) {
        console.log(chalk.green(`  Example: ${command.examples[0]}`));
      }
      console.log();
    });
  }
  
  /**
   * Process help command with various options
   * @param {string} input - User input for help
   */
  processHelpCommand(input) {
    const parts = input.toLowerCase().split(' ').filter(part => part.length > 0);
    
    if (parts.length === 1) {
      // Just "help"
      this.displayOverview();
      return;
    }
    
    const subcommand = parts[1];
    
    switch (subcommand) {
      case 'commands':
        this.displayAllCommands();
        break;
        
      case 'categories':
        console.log(chalk.blue.bold('\n📂 AVAILABLE CATEGORIES:'));
        this.getCategories().forEach(category => {
          const commands = this.getCategory(category);
          console.log(chalk.white(`• ${category} (${commands.length} commands)`));
        });
        break;
        
      case 'search':
        if (parts.length < 3) {
          console.log(chalk.red('❌ Usage: help search <term>'));
          return;
        }
        const searchTerm = parts.slice(2).join(' ');
        this.displaySearchResults(searchTerm);
        break;
        
      default:
        // Check if it's a category
        if (this.categories.has(subcommand)) {
          this.displayCategoryHelp(subcommand);
        } else {
          // Check if it's a command
          this.displayCommandHelp(subcommand);
        }
        break;
    }
  }
  
  /**
   * Get command suggestions based on partial input
   * @param {string} partial - Partial command input
   * @returns {Array} Array of suggested commands
   */
  getSuggestions(partial) {
    const suggestions = [];
    const partialLower = partial.toLowerCase();
    
    for (const [name, command] of this.commands.entries()) {
      if (name.startsWith(partialLower)) {
        suggestions.push(command);
      }
    }
    
    return suggestions.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  /**
   * Generate help documentation and save to file
   */
  generateDocumentation() {
    const docs = [];
    
    docs.push('# Neversleep.ai Command Reference');
    docs.push('');
    docs.push('This document contains all available commands and their usage.');
    docs.push('');
    
    for (const category of this.getCategories()) {
      docs.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)} Commands`);
      docs.push('');
      
      const commands = this.getCategory(category);
      
      for (const command of commands) {
        docs.push(`### ${command.name}`);
        docs.push('');
        docs.push(`**Description:** ${command.description}`);
        docs.push('');
        docs.push(`**Usage:** \`${command.usage}\``);
        docs.push('');
        
        if (command.examples && command.examples.length > 0) {
          docs.push('**Examples:**');
          command.examples.forEach(example => {
            docs.push(`- \`${example}\``);
          });
          docs.push('');
        }
        
        if (command.details) {
          docs.push(`**Details:** ${command.details}`);
          docs.push('');
        }
        
        docs.push('---');
        docs.push('');
      }
    }
    
    const docPath = path.join(__dirname, 'COMMANDS.md');
    fs.writeFileSync(docPath, docs.join('\n'));
    
    logger.info(`[Help] Generated command documentation: ${docPath}`);
    return docPath;
  }
}

module.exports = HelpSystem;
