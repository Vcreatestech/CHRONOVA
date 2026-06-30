/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Custom mathematical expression parser for a reliable and secure scientific calculator.

export type AngleMode = 'deg' | 'rad';

export interface ParseResult {
  success: boolean;
  value?: number;
  error?: string;
}

export function evaluateExpression(expression: string, angleMode: AngleMode = 'rad'): ParseResult {
  try {
    // 1. Sanitize and normalize string
    let sanitized = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'Math.PI')
      .replace(/e/g, 'Math.E')
      .trim();

    // If empty, return 0
    if (!sanitized) {
      return { success: true, value: 0 };
    }

    const tokens = tokenize(sanitized);
    const parser = new MathParser(tokens, angleMode);
    const result = parser.parse();
    
    if (isNaN(result) || !isFinite(result)) {
      return { success: false, error: 'Undefined' };
    }
    
    return { success: true, value: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Syntax Error' };
  }
}

// Token types
type TokenType = 'NUMBER' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'FUNCTION' | 'CONSTANT' | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const functions = ['sin', 'cos', 'tan', 'ln', 'log', 'sqrt'];

  while (i < input.length) {
    const char = input[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Numbers
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < input.length && /[0-9.]/.test(input[i])) {
        numStr += input[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Identifiers (functions or constants)
    if (/[a-zA-Z]/.test(char)) {
      let ident = '';
      while (i < input.length && /[a-zA-Z0-9._]/.test(input[i])) {
        ident += input[i];
        i++;
      }

      if (ident === 'Math.PI') {
        tokens.push({ type: 'CONSTANT', value: String(Math.PI) });
      } else if (ident === 'Math.E') {
        tokens.push({ type: 'CONSTANT', value: String(Math.E) });
      } else if (functions.includes(ident)) {
        tokens.push({ type: 'FUNCTION', value: ident });
      } else {
        throw new Error(`Unknown identifier: ${ident}`);
      }
      continue;
    }

    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Operators & Factorial
    if (['+', '-', '*', '/', '^', '%', '!'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    throw new Error(`Invalid character: ${char}`);
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

class MathParser {
  private tokens: Token[];
  private current = 0;
  private angleMode: AngleMode;

  constructor(tokens: Token[], angleMode: AngleMode) {
    this.tokens = tokens;
    this.angleMode = angleMode;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private match(type: TokenType, value?: string): boolean {
    const t = this.peek();
    if (t.type === type && (!value || t.value === value)) {
      this.current++;
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    const t = this.peek();
    if (t.type === type) {
      this.current++;
      return t;
    }
    throw new Error(message);
  }

  public parse(): number {
    const val = this.expression();
    if (this.peek().type !== 'EOF') {
      throw new Error('Unexpected tokens at end of expression');
    }
    return val;
  }

  // Precedence level 1: Additive (+, -)
  private expression(): number {
    let val = this.term();
    while (true) {
      if (this.match('OPERATOR', '+')) {
        val += this.term();
      } else if (this.match('OPERATOR', '-')) {
        val -= this.term();
      } else {
        break;
      }
    }
    return val;
  }

  // Precedence level 2: Multiplicative (*, /, %)
  private term(): number {
    let val = this.factor();
    while (true) {
      if (this.match('OPERATOR', '*')) {
        val *= this.factor();
      } else if (this.match('OPERATOR', '/')) {
        const divisor = this.factor();
        if (divisor === 0) {
          throw new Error('Division by zero');
        }
        val /= divisor;
      } else if (this.match('OPERATOR', '%')) {
        // Handle modulo or percentage modifier
        // e.g. "50 %" can be treated as 0.5 if followed by EOF or operand, or standard modulo.
        // Let's implement standard mathematical modulo for '%' between terms, 
        // or percentage modifier if the next token is not a factor.
        const next = this.peek();
        if (next.type === 'OPERATOR' || next.type === 'RPAREN' || next.type === 'EOF') {
          val = val / 100;
        } else {
          val %= this.factor();
        }
      } else {
        break;
      }
    }
    return val;
  }

  // Precedence level 3: Unary signs (+, -) and Factorial/Power
  private factor(): number {
    if (this.match('OPERATOR', '-')) {
      return -this.exponent();
    }
    if (this.match('OPERATOR', '+')) {
      return this.exponent();
    }
    return this.exponent();
  }

  // Precedence level 4: Exponentiation (right-associative)
  private exponent(): number {
    let val = this.primary();
    
    // Check for trailing factorial first (higher precedence than power in many cases, or we can handle right after primary)
    while (this.match('OPERATOR', '!')) {
      val = this.factorial(val);
    }

    if (this.match('OPERATOR', '^')) {
      const power = this.exponent(); // Right associative recursive call
      val = Math.pow(val, power);
    }

    // Check again for factorial after power
    while (this.match('OPERATOR', '!')) {
      val = this.factorial(val);
    }

    return val;
  }

  private factorial(n: number): number {
    if (n < 0) throw new Error('Factorial of negative number');
    if (!Number.isInteger(n)) {
      // Gamma approximation or error
      throw new Error('Factorial requires an integer');
    }
    if (n > 170) throw new Error('Overflow'); // limit factorial for JS infinity
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  // Precedence level 5: Primary values, Functions, Parentheses
  private primary(): number {
    const t = this.peek();

    if (this.match('NUMBER')) {
      return parseFloat(t.value);
    }

    if (this.match('CONSTANT')) {
      return parseFloat(t.value);
    }

    if (this.match('FUNCTION')) {
      const funcName = t.value;
      this.consume('LPAREN', `Expected '(' after function ${funcName}`);
      let arg = this.expression();
      this.consume('RPAREN', `Expected ')' after argument of ${funcName}`);

      switch (funcName) {
        case 'sin':
          if (this.angleMode === 'deg') {
            arg = (arg * Math.PI) / 180;
          }
          return Math.sin(arg);
        case 'cos':
          if (this.angleMode === 'deg') {
            arg = (arg * Math.PI) / 180;
          }
          return Math.cos(arg);
        case 'tan':
          if (this.angleMode === 'deg') {
            arg = (arg * Math.PI) / 180;
          }
          // Handle tan(90 deg) infinity or overflow
          if (this.angleMode === 'deg' && Math.abs(arg % Math.PI - Math.PI / 2) < 1e-10) {
            throw new Error('Undefined');
          }
          return Math.tan(arg);
        case 'ln':
          if (arg <= 0) throw new Error('Invalid ln argument');
          return Math.log(arg);
        case 'log':
          if (arg <= 0) throw new Error('Invalid log argument');
          return Math.log10(arg);
        case 'sqrt':
          if (arg < 0) throw new Error('Square root of negative number');
          return Math.sqrt(arg);
        default:
          throw new Error(`Unsupported function: ${funcName}`);
      }
    }

    if (this.match('LPAREN')) {
      const val = this.expression();
      this.consume('RPAREN', "Expected ')' to balance opening parenthesis");
      return val;
    }

    throw new Error('Expected number, constant, function, or parenthesis');
  }
}
