(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[58],{

/***/ "./node_modules/monaco-editor/esm/vs/basic-languages/typescript/typescript.js":
/*!************************************************************************************!*\
  !*** ./node_modules/monaco-editor/esm/vs/basic-languages/typescript/typescript.js ***!
  \************************************************************************************/
/*! exports provided: conf, language */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"conf\", function() { return conf; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"language\", function() { return language; });\n/*---------------------------------------------------------------------------------------------\n *  Copyright (c) Microsoft Corporation. All rights reserved.\n *  Licensed under the MIT License. See License.txt in the project root for license information.\n *--------------------------------------------------------------------------------------------*/\n\n// Allow for running under nodejs/requirejs in tests\nvar _monaco = (typeof monaco === 'undefined' ? self.monaco : monaco);\nvar conf = {\n    wordPattern: /(-?\\d*\\.\\d\\w*)|([^\\`\\~\\!\\@\\#\\%\\^\\&\\*\\(\\)\\-\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\?\\s]+)/g,\n    comments: {\n        lineComment: '//',\n        blockComment: ['/*', '*/']\n    },\n    brackets: [\n        ['{', '}'],\n        ['[', ']'],\n        ['(', ')']\n    ],\n    onEnterRules: [\n        {\n            // e.g. /** | */\n            beforeText: /^\\s*\\/\\*\\*(?!\\/)([^\\*]|\\*(?!\\/))*$/,\n            afterText: /^\\s*\\*\\/$/,\n            action: { indentAction: _monaco.languages.IndentAction.IndentOutdent, appendText: ' * ' }\n        },\n        {\n            // e.g. /** ...|\n            beforeText: /^\\s*\\/\\*\\*(?!\\/)([^\\*]|\\*(?!\\/))*$/,\n            action: { indentAction: _monaco.languages.IndentAction.None, appendText: ' * ' }\n        },\n        {\n            // e.g.  * ...|\n            beforeText: /^(\\t|(\\ \\ ))*\\ \\*(\\ ([^\\*]|\\*(?!\\/))*)?$/,\n            action: { indentAction: _monaco.languages.IndentAction.None, appendText: '* ' }\n        },\n        {\n            // e.g.  */|\n            beforeText: /^(\\t|(\\ \\ ))*\\ \\*\\/\\s*$/,\n            action: { indentAction: _monaco.languages.IndentAction.None, removeText: 1 }\n        }\n    ],\n    autoClosingPairs: [\n        { open: '{', close: '}' },\n        { open: '[', close: ']' },\n        { open: '(', close: ')' },\n        { open: '\"', close: '\"', notIn: ['string'] },\n        { open: '\\'', close: '\\'', notIn: ['string', 'comment'] },\n        { open: '`', close: '`', notIn: ['string', 'comment'] },\n        { open: \"/**\", close: \" */\", notIn: [\"string\"] }\n    ],\n    folding: {\n        markers: {\n            start: new RegExp(\"^\\\\s*//\\\\s*#?region\\\\b\"),\n            end: new RegExp(\"^\\\\s*//\\\\s*#?endregion\\\\b\")\n        }\n    }\n};\nvar language = {\n    // Set defaultToken to invalid to see what you do not tokenize yet\n    defaultToken: 'invalid',\n    tokenPostfix: '.ts',\n    keywords: [\n        'abstract', 'as', 'break', 'case', 'catch', 'class', 'continue', 'const',\n        'constructor', 'debugger', 'declare', 'default', 'delete', 'do', 'else',\n        'enum', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function',\n        'get', 'if', 'implements', 'import', 'in', 'infer', 'instanceof', 'interface',\n        'is', 'keyof', 'let', 'module', 'namespace', 'never', 'new', 'null', 'package',\n        'private', 'protected', 'public', 'readonly', 'require', 'global', 'return',\n        'set', 'static', 'super', 'switch', 'symbol', 'this', 'throw', 'true', 'try',\n        'type', 'typeof', 'unique', 'var', 'void', 'while', 'with', 'yield', 'async',\n        'await', 'of'\n    ],\n    typeKeywords: [\n        'any', 'boolean', 'number', 'object', 'string', 'undefined'\n    ],\n    operators: [\n        '<=', '>=', '==', '!=', '===', '!==', '=>', '+', '-', '**',\n        '*', '/', '%', '++', '--', '<<', '</', '>>', '>>>', '&',\n        '|', '^', '!', '~', '&&', '||', '?', ':', '=', '+=', '-=',\n        '*=', '**=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '|=',\n        '^=', '@',\n    ],\n    // we include these common regular expressions\n    symbols: /[=><!~?:&|+\\-*\\/\\^%]+/,\n    escapes: /\\\\(?:[abfnrtv\\\\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,\n    digits: /\\d+(_+\\d+)*/,\n    octaldigits: /[0-7]+(_+[0-7]+)*/,\n    binarydigits: /[0-1]+(_+[0-1]+)*/,\n    hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,\n    regexpctl: /[(){}\\[\\]\\$\\^|\\-*+?\\.]/,\n    regexpesc: /\\\\(?:[bBdDfnrstvwWn0\\\\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,\n    // The main tokenizer for our languages\n    tokenizer: {\n        root: [\n            [/[{}]/, 'delimiter.bracket'],\n            { include: 'common' }\n        ],\n        common: [\n            // identifiers and keywords\n            [/[a-z_$][\\w$]*/, {\n                    cases: {\n                        '@typeKeywords': 'keyword',\n                        '@keywords': 'keyword',\n                        '@default': 'identifier'\n                    }\n                }],\n            [/[A-Z][\\w\\$]*/, 'type.identifier'],\n            // [/[A-Z][\\w\\$]*/, 'identifier'],\n            // whitespace\n            { include: '@whitespace' },\n            // regular expression: ensure it is terminated before beginning (otherwise it is an opeator)\n            [/\\/(?=([^\\\\\\/]|\\\\.)+\\/([gimsuy]*)(\\s*)(\\.|;|\\/|,|\\)|\\]|\\}|$))/, { token: 'regexp', bracket: '@open', next: '@regexp' }],\n            // delimiters and operators\n            [/[()\\[\\]]/, '@brackets'],\n            [/[<>](?!@symbols)/, '@brackets'],\n            [/!(?=([^=]|$))/, 'delimiter'],\n            [/@symbols/, {\n                    cases: {\n                        '@operators': 'delimiter',\n                        '@default': ''\n                    }\n                }],\n            // numbers\n            [/(@digits)[eE]([\\-+]?(@digits))?/, 'number.float'],\n            [/(@digits)\\.(@digits)([eE][\\-+]?(@digits))?/, 'number.float'],\n            [/0[xX](@hexdigits)n?/, 'number.hex'],\n            [/0[oO]?(@octaldigits)n?/, 'number.octal'],\n            [/0[bB](@binarydigits)n?/, 'number.binary'],\n            [/(@digits)n?/, 'number'],\n            // delimiter: after number because of .\\d floats\n            [/[;,.]/, 'delimiter'],\n            // strings\n            [/\"([^\"\\\\]|\\\\.)*$/, 'string.invalid'],\n            [/'([^'\\\\]|\\\\.)*$/, 'string.invalid'],\n            [/\"/, 'string', '@string_double'],\n            [/'/, 'string', '@string_single'],\n            [/`/, 'string', '@string_backtick'],\n        ],\n        whitespace: [\n            [/[ \\t\\r\\n]+/, ''],\n            [/\\/\\*\\*(?!\\/)/, 'comment.doc', '@jsdoc'],\n            [/\\/\\*/, 'comment', '@comment'],\n            [/\\/\\/.*$/, 'comment'],\n        ],\n        comment: [\n            [/[^\\/*]+/, 'comment'],\n            [/\\*\\//, 'comment', '@pop'],\n            [/[\\/*]/, 'comment']\n        ],\n        jsdoc: [\n            [/[^\\/*]+/, 'comment.doc'],\n            [/\\*\\//, 'comment.doc', '@pop'],\n            [/[\\/*]/, 'comment.doc']\n        ],\n        // We match regular expression quite precisely\n        regexp: [\n            [/(\\{)(\\d+(?:,\\d*)?)(\\})/, ['regexp.escape.control', 'regexp.escape.control', 'regexp.escape.control']],\n            [/(\\[)(\\^?)(?=(?:[^\\]\\\\\\/]|\\\\.)+)/, ['regexp.escape.control', { token: 'regexp.escape.control', next: '@regexrange' }]],\n            [/(\\()(\\?:|\\?=|\\?!)/, ['regexp.escape.control', 'regexp.escape.control']],\n            [/[()]/, 'regexp.escape.control'],\n            [/@regexpctl/, 'regexp.escape.control'],\n            [/[^\\\\\\/]/, 'regexp'],\n            [/@regexpesc/, 'regexp.escape'],\n            [/\\\\\\./, 'regexp.invalid'],\n            [/(\\/)([gimsuy]*)/, [{ token: 'regexp', bracket: '@close', next: '@pop' }, 'keyword.other']],\n        ],\n        regexrange: [\n            [/-/, 'regexp.escape.control'],\n            [/\\^/, 'regexp.invalid'],\n            [/@regexpesc/, 'regexp.escape'],\n            [/[^\\]]/, 'regexp'],\n            [/\\]/, { token: 'regexp.escape.control', next: '@pop', bracket: '@close' }]\n        ],\n        string_double: [\n            [/[^\\\\\"]+/, 'string'],\n            [/@escapes/, 'string.escape'],\n            [/\\\\./, 'string.escape.invalid'],\n            [/\"/, 'string', '@pop']\n        ],\n        string_single: [\n            [/[^\\\\']+/, 'string'],\n            [/@escapes/, 'string.escape'],\n            [/\\\\./, 'string.escape.invalid'],\n            [/'/, 'string', '@pop']\n        ],\n        string_backtick: [\n            [/\\$\\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],\n            [/[^\\\\`$]+/, 'string'],\n            [/@escapes/, 'string.escape'],\n            [/\\\\./, 'string.escape.invalid'],\n            [/`/, 'string', '@pop']\n        ],\n        bracketCounting: [\n            [/\\{/, 'delimiter.bracket', '@bracketCounting'],\n            [/\\}/, 'delimiter.bracket', '@pop'],\n            { include: 'common' }\n        ],\n    },\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9ub2RlX21vZHVsZXMvbW9uYWNvLWVkaXRvci9lc20vdnMvYmFzaWMtbGFuZ3VhZ2VzL3R5cGVzY3JpcHQvdHlwZXNjcmlwdC5qcy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9tb25hY28tZWRpdG9yL2VzbS92cy9iYXNpYy1sYW5ndWFnZXMvdHlwZXNjcmlwdC90eXBlc2NyaXB0LmpzP2YzYjciXSwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG4ndXNlIHN0cmljdCc7XG4vLyBBbGxvdyBmb3IgcnVubmluZyB1bmRlciBub2RlanMvcmVxdWlyZWpzIGluIHRlc3RzXG52YXIgX21vbmFjbyA9ICh0eXBlb2YgbW9uYWNvID09PSAndW5kZWZpbmVkJyA/IHNlbGYubW9uYWNvIDogbW9uYWNvKTtcbmV4cG9ydCB2YXIgY29uZiA9IHtcbiAgICB3b3JkUGF0dGVybjogLygtP1xcZCpcXC5cXGRcXHcqKXwoW15cXGBcXH5cXCFcXEBcXCNcXCVcXF5cXCZcXCpcXChcXClcXC1cXD1cXCtcXFtcXHtcXF1cXH1cXFxcXFx8XFw7XFw6XFwnXFxcIlxcLFxcLlxcPFxcPlxcL1xcP1xcc10rKS9nLFxuICAgIGNvbW1lbnRzOiB7XG4gICAgICAgIGxpbmVDb21tZW50OiAnLy8nLFxuICAgICAgICBibG9ja0NvbW1lbnQ6IFsnLyonLCAnKi8nXVxuICAgIH0sXG4gICAgYnJhY2tldHM6IFtcbiAgICAgICAgWyd7JywgJ30nXSxcbiAgICAgICAgWydbJywgJ10nXSxcbiAgICAgICAgWycoJywgJyknXVxuICAgIF0sXG4gICAgb25FbnRlclJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIGUuZy4gLyoqIHwgKi9cbiAgICAgICAgICAgIGJlZm9yZVRleHQ6IC9eXFxzKlxcL1xcKlxcKig/IVxcLykoW15cXCpdfFxcKig/IVxcLykpKiQvLFxuICAgICAgICAgICAgYWZ0ZXJUZXh0OiAvXlxccypcXCpcXC8kLyxcbiAgICAgICAgICAgIGFjdGlvbjogeyBpbmRlbnRBY3Rpb246IF9tb25hY28ubGFuZ3VhZ2VzLkluZGVudEFjdGlvbi5JbmRlbnRPdXRkZW50LCBhcHBlbmRUZXh0OiAnICogJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIGUuZy4gLyoqIC4uLnxcbiAgICAgICAgICAgIGJlZm9yZVRleHQ6IC9eXFxzKlxcL1xcKlxcKig/IVxcLykoW15cXCpdfFxcKig/IVxcLykpKiQvLFxuICAgICAgICAgICAgYWN0aW9uOiB7IGluZGVudEFjdGlvbjogX21vbmFjby5sYW5ndWFnZXMuSW5kZW50QWN0aW9uLk5vbmUsIGFwcGVuZFRleHQ6ICcgKiAnIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgLy8gZS5nLiAgKiAuLi58XG4gICAgICAgICAgICBiZWZvcmVUZXh0OiAvXihcXHR8KFxcIFxcICkpKlxcIFxcKihcXCAoW15cXCpdfFxcKig/IVxcLykpKik/JC8sXG4gICAgICAgICAgICBhY3Rpb246IHsgaW5kZW50QWN0aW9uOiBfbW9uYWNvLmxhbmd1YWdlcy5JbmRlbnRBY3Rpb24uTm9uZSwgYXBwZW5kVGV4dDogJyogJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIGUuZy4gICovfFxuICAgICAgICAgICAgYmVmb3JlVGV4dDogL14oXFx0fChcXCBcXCApKSpcXCBcXCpcXC9cXHMqJC8sXG4gICAgICAgICAgICBhY3Rpb246IHsgaW5kZW50QWN0aW9uOiBfbW9uYWNvLmxhbmd1YWdlcy5JbmRlbnRBY3Rpb24uTm9uZSwgcmVtb3ZlVGV4dDogMSB9XG4gICAgICAgIH1cbiAgICBdLFxuICAgIGF1dG9DbG9zaW5nUGFpcnM6IFtcbiAgICAgICAgeyBvcGVuOiAneycsIGNsb3NlOiAnfScgfSxcbiAgICAgICAgeyBvcGVuOiAnWycsIGNsb3NlOiAnXScgfSxcbiAgICAgICAgeyBvcGVuOiAnKCcsIGNsb3NlOiAnKScgfSxcbiAgICAgICAgeyBvcGVuOiAnXCInLCBjbG9zZTogJ1wiJywgbm90SW46IFsnc3RyaW5nJ10gfSxcbiAgICAgICAgeyBvcGVuOiAnXFwnJywgY2xvc2U6ICdcXCcnLCBub3RJbjogWydzdHJpbmcnLCAnY29tbWVudCddIH0sXG4gICAgICAgIHsgb3BlbjogJ2AnLCBjbG9zZTogJ2AnLCBub3RJbjogWydzdHJpbmcnLCAnY29tbWVudCddIH0sXG4gICAgICAgIHsgb3BlbjogXCIvKipcIiwgY2xvc2U6IFwiICovXCIsIG5vdEluOiBbXCJzdHJpbmdcIl0gfVxuICAgIF0sXG4gICAgZm9sZGluZzoge1xuICAgICAgICBtYXJrZXJzOiB7XG4gICAgICAgICAgICBzdGFydDogbmV3IFJlZ0V4cChcIl5cXFxccyovL1xcXFxzKiM/cmVnaW9uXFxcXGJcIiksXG4gICAgICAgICAgICBlbmQ6IG5ldyBSZWdFeHAoXCJeXFxcXHMqLy9cXFxccyojP2VuZHJlZ2lvblxcXFxiXCIpXG4gICAgICAgIH1cbiAgICB9XG59O1xuZXhwb3J0IHZhciBsYW5ndWFnZSA9IHtcbiAgICAvLyBTZXQgZGVmYXVsdFRva2VuIHRvIGludmFsaWQgdG8gc2VlIHdoYXQgeW91IGRvIG5vdCB0b2tlbml6ZSB5ZXRcbiAgICBkZWZhdWx0VG9rZW46ICdpbnZhbGlkJyxcbiAgICB0b2tlblBvc3RmaXg6ICcudHMnLFxuICAgIGtleXdvcmRzOiBbXG4gICAgICAgICdhYnN0cmFjdCcsICdhcycsICdicmVhaycsICdjYXNlJywgJ2NhdGNoJywgJ2NsYXNzJywgJ2NvbnRpbnVlJywgJ2NvbnN0JyxcbiAgICAgICAgJ2NvbnN0cnVjdG9yJywgJ2RlYnVnZ2VyJywgJ2RlY2xhcmUnLCAnZGVmYXVsdCcsICdkZWxldGUnLCAnZG8nLCAnZWxzZScsXG4gICAgICAgICdlbnVtJywgJ2V4cG9ydCcsICdleHRlbmRzJywgJ2ZhbHNlJywgJ2ZpbmFsbHknLCAnZm9yJywgJ2Zyb20nLCAnZnVuY3Rpb24nLFxuICAgICAgICAnZ2V0JywgJ2lmJywgJ2ltcGxlbWVudHMnLCAnaW1wb3J0JywgJ2luJywgJ2luZmVyJywgJ2luc3RhbmNlb2YnLCAnaW50ZXJmYWNlJyxcbiAgICAgICAgJ2lzJywgJ2tleW9mJywgJ2xldCcsICdtb2R1bGUnLCAnbmFtZXNwYWNlJywgJ25ldmVyJywgJ25ldycsICdudWxsJywgJ3BhY2thZ2UnLFxuICAgICAgICAncHJpdmF0ZScsICdwcm90ZWN0ZWQnLCAncHVibGljJywgJ3JlYWRvbmx5JywgJ3JlcXVpcmUnLCAnZ2xvYmFsJywgJ3JldHVybicsXG4gICAgICAgICdzZXQnLCAnc3RhdGljJywgJ3N1cGVyJywgJ3N3aXRjaCcsICdzeW1ib2wnLCAndGhpcycsICd0aHJvdycsICd0cnVlJywgJ3RyeScsXG4gICAgICAgICd0eXBlJywgJ3R5cGVvZicsICd1bmlxdWUnLCAndmFyJywgJ3ZvaWQnLCAnd2hpbGUnLCAnd2l0aCcsICd5aWVsZCcsICdhc3luYycsXG4gICAgICAgICdhd2FpdCcsICdvZidcbiAgICBdLFxuICAgIHR5cGVLZXl3b3JkczogW1xuICAgICAgICAnYW55JywgJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ29iamVjdCcsICdzdHJpbmcnLCAndW5kZWZpbmVkJ1xuICAgIF0sXG4gICAgb3BlcmF0b3JzOiBbXG4gICAgICAgICc8PScsICc+PScsICc9PScsICchPScsICc9PT0nLCAnIT09JywgJz0+JywgJysnLCAnLScsICcqKicsXG4gICAgICAgICcqJywgJy8nLCAnJScsICcrKycsICctLScsICc8PCcsICc8LycsICc+PicsICc+Pj4nLCAnJicsXG4gICAgICAgICd8JywgJ14nLCAnIScsICd+JywgJyYmJywgJ3x8JywgJz8nLCAnOicsICc9JywgJys9JywgJy09JyxcbiAgICAgICAgJyo9JywgJyoqPScsICcvPScsICclPScsICc8PD0nLCAnPj49JywgJz4+Pj0nLCAnJj0nLCAnfD0nLFxuICAgICAgICAnXj0nLCAnQCcsXG4gICAgXSxcbiAgICAvLyB3ZSBpbmNsdWRlIHRoZXNlIGNvbW1vbiByZWd1bGFyIGV4cHJlc3Npb25zXG4gICAgc3ltYm9sczogL1s9Pjwhfj86JnwrXFwtKlxcL1xcXiVdKy8sXG4gICAgZXNjYXBlczogL1xcXFwoPzpbYWJmbnJ0dlxcXFxcIiddfHhbMC05QS1GYS1mXXsxLDR9fHVbMC05QS1GYS1mXXs0fXxVWzAtOUEtRmEtZl17OH0pLyxcbiAgICBkaWdpdHM6IC9cXGQrKF8rXFxkKykqLyxcbiAgICBvY3RhbGRpZ2l0czogL1swLTddKyhfK1swLTddKykqLyxcbiAgICBiaW5hcnlkaWdpdHM6IC9bMC0xXSsoXytbMC0xXSspKi8sXG4gICAgaGV4ZGlnaXRzOiAvW1swLTlhLWZBLUZdKyhfK1swLTlhLWZBLUZdKykqLyxcbiAgICByZWdleHBjdGw6IC9bKCl7fVxcW1xcXVxcJFxcXnxcXC0qKz9cXC5dLyxcbiAgICByZWdleHBlc2M6IC9cXFxcKD86W2JCZERmbnJzdHZ3V24wXFxcXFxcL118QHJlZ2V4cGN0bHxjW0EtWl18eFswLTlhLWZBLUZdezJ9fHVbMC05YS1mQS1GXXs0fSkvLFxuICAgIC8vIFRoZSBtYWluIHRva2VuaXplciBmb3Igb3VyIGxhbmd1YWdlc1xuICAgIHRva2VuaXplcjoge1xuICAgICAgICByb290OiBbXG4gICAgICAgICAgICBbL1t7fV0vLCAnZGVsaW1pdGVyLmJyYWNrZXQnXSxcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ2NvbW1vbicgfVxuICAgICAgICBdLFxuICAgICAgICBjb21tb246IFtcbiAgICAgICAgICAgIC8vIGlkZW50aWZpZXJzIGFuZCBrZXl3b3Jkc1xuICAgICAgICAgICAgWy9bYS16XyRdW1xcdyRdKi8sIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdAdHlwZUtleXdvcmRzJzogJ2tleXdvcmQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BrZXl3b3Jkcyc6ICdrZXl3b3JkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdAZGVmYXVsdCc6ICdpZGVudGlmaWVyJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBbL1tBLVpdW1xcd1xcJF0qLywgJ3R5cGUuaWRlbnRpZmllciddLFxuICAgICAgICAgICAgLy8gWy9bQS1aXVtcXHdcXCRdKi8sICdpZGVudGlmaWVyJ10sXG4gICAgICAgICAgICAvLyB3aGl0ZXNwYWNlXG4gICAgICAgICAgICB7IGluY2x1ZGU6ICdAd2hpdGVzcGFjZScgfSxcbiAgICAgICAgICAgIC8vIHJlZ3VsYXIgZXhwcmVzc2lvbjogZW5zdXJlIGl0IGlzIHRlcm1pbmF0ZWQgYmVmb3JlIGJlZ2lubmluZyAob3RoZXJ3aXNlIGl0IGlzIGFuIG9wZWF0b3IpXG4gICAgICAgICAgICBbL1xcLyg/PShbXlxcXFxcXC9dfFxcXFwuKStcXC8oW2dpbXN1eV0qKShcXHMqKShcXC58O3xcXC98LHxcXCl8XFxdfFxcfXwkKSkvLCB7IHRva2VuOiAncmVnZXhwJywgYnJhY2tldDogJ0BvcGVuJywgbmV4dDogJ0ByZWdleHAnIH1dLFxuICAgICAgICAgICAgLy8gZGVsaW1pdGVycyBhbmQgb3BlcmF0b3JzXG4gICAgICAgICAgICBbL1soKVxcW1xcXV0vLCAnQGJyYWNrZXRzJ10sXG4gICAgICAgICAgICBbL1s8Pl0oPyFAc3ltYm9scykvLCAnQGJyYWNrZXRzJ10sXG4gICAgICAgICAgICBbLyEoPz0oW149XXwkKSkvLCAnZGVsaW1pdGVyJ10sXG4gICAgICAgICAgICBbL0BzeW1ib2xzLywge1xuICAgICAgICAgICAgICAgICAgICBjYXNlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0BvcGVyYXRvcnMnOiAnZGVsaW1pdGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdAZGVmYXVsdCc6ICcnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIC8vIG51bWJlcnNcbiAgICAgICAgICAgIFsvKEBkaWdpdHMpW2VFXShbXFwtK10/KEBkaWdpdHMpKT8vLCAnbnVtYmVyLmZsb2F0J10sXG4gICAgICAgICAgICBbLyhAZGlnaXRzKVxcLihAZGlnaXRzKShbZUVdW1xcLStdPyhAZGlnaXRzKSk/LywgJ251bWJlci5mbG9hdCddLFxuICAgICAgICAgICAgWy8wW3hYXShAaGV4ZGlnaXRzKW4/LywgJ251bWJlci5oZXgnXSxcbiAgICAgICAgICAgIFsvMFtvT10/KEBvY3RhbGRpZ2l0cyluPy8sICdudW1iZXIub2N0YWwnXSxcbiAgICAgICAgICAgIFsvMFtiQl0oQGJpbmFyeWRpZ2l0cyluPy8sICdudW1iZXIuYmluYXJ5J10sXG4gICAgICAgICAgICBbLyhAZGlnaXRzKW4/LywgJ251bWJlciddLFxuICAgICAgICAgICAgLy8gZGVsaW1pdGVyOiBhZnRlciBudW1iZXIgYmVjYXVzZSBvZiAuXFxkIGZsb2F0c1xuICAgICAgICAgICAgWy9bOywuXS8sICdkZWxpbWl0ZXInXSxcbiAgICAgICAgICAgIC8vIHN0cmluZ3NcbiAgICAgICAgICAgIFsvXCIoW15cIlxcXFxdfFxcXFwuKSokLywgJ3N0cmluZy5pbnZhbGlkJ10sXG4gICAgICAgICAgICBbLycoW14nXFxcXF18XFxcXC4pKiQvLCAnc3RyaW5nLmludmFsaWQnXSxcbiAgICAgICAgICAgIFsvXCIvLCAnc3RyaW5nJywgJ0BzdHJpbmdfZG91YmxlJ10sXG4gICAgICAgICAgICBbLycvLCAnc3RyaW5nJywgJ0BzdHJpbmdfc2luZ2xlJ10sXG4gICAgICAgICAgICBbL2AvLCAnc3RyaW5nJywgJ0BzdHJpbmdfYmFja3RpY2snXSxcbiAgICAgICAgXSxcbiAgICAgICAgd2hpdGVzcGFjZTogW1xuICAgICAgICAgICAgWy9bIFxcdFxcclxcbl0rLywgJyddLFxuICAgICAgICAgICAgWy9cXC9cXCpcXCooPyFcXC8pLywgJ2NvbW1lbnQuZG9jJywgJ0Bqc2RvYyddLFxuICAgICAgICAgICAgWy9cXC9cXCovLCAnY29tbWVudCcsICdAY29tbWVudCddLFxuICAgICAgICAgICAgWy9cXC9cXC8uKiQvLCAnY29tbWVudCddLFxuICAgICAgICBdLFxuICAgICAgICBjb21tZW50OiBbXG4gICAgICAgICAgICBbL1teXFwvKl0rLywgJ2NvbW1lbnQnXSxcbiAgICAgICAgICAgIFsvXFwqXFwvLywgJ2NvbW1lbnQnLCAnQHBvcCddLFxuICAgICAgICAgICAgWy9bXFwvKl0vLCAnY29tbWVudCddXG4gICAgICAgIF0sXG4gICAgICAgIGpzZG9jOiBbXG4gICAgICAgICAgICBbL1teXFwvKl0rLywgJ2NvbW1lbnQuZG9jJ10sXG4gICAgICAgICAgICBbL1xcKlxcLy8sICdjb21tZW50LmRvYycsICdAcG9wJ10sXG4gICAgICAgICAgICBbL1tcXC8qXS8sICdjb21tZW50LmRvYyddXG4gICAgICAgIF0sXG4gICAgICAgIC8vIFdlIG1hdGNoIHJlZ3VsYXIgZXhwcmVzc2lvbiBxdWl0ZSBwcmVjaXNlbHlcbiAgICAgICAgcmVnZXhwOiBbXG4gICAgICAgICAgICBbLyhcXHspKFxcZCsoPzosXFxkKik/KShcXH0pLywgWydyZWdleHAuZXNjYXBlLmNvbnRyb2wnLCAncmVnZXhwLmVzY2FwZS5jb250cm9sJywgJ3JlZ2V4cC5lc2NhcGUuY29udHJvbCddXSxcbiAgICAgICAgICAgIFsvKFxcWykoXFxePykoPz0oPzpbXlxcXVxcXFxcXC9dfFxcXFwuKSspLywgWydyZWdleHAuZXNjYXBlLmNvbnRyb2wnLCB7IHRva2VuOiAncmVnZXhwLmVzY2FwZS5jb250cm9sJywgbmV4dDogJ0ByZWdleHJhbmdlJyB9XV0sXG4gICAgICAgICAgICBbLyhcXCgpKFxcPzp8XFw/PXxcXD8hKS8sIFsncmVnZXhwLmVzY2FwZS5jb250cm9sJywgJ3JlZ2V4cC5lc2NhcGUuY29udHJvbCddXSxcbiAgICAgICAgICAgIFsvWygpXS8sICdyZWdleHAuZXNjYXBlLmNvbnRyb2wnXSxcbiAgICAgICAgICAgIFsvQHJlZ2V4cGN0bC8sICdyZWdleHAuZXNjYXBlLmNvbnRyb2wnXSxcbiAgICAgICAgICAgIFsvW15cXFxcXFwvXS8sICdyZWdleHAnXSxcbiAgICAgICAgICAgIFsvQHJlZ2V4cGVzYy8sICdyZWdleHAuZXNjYXBlJ10sXG4gICAgICAgICAgICBbL1xcXFxcXC4vLCAncmVnZXhwLmludmFsaWQnXSxcbiAgICAgICAgICAgIFsvKFxcLykoW2dpbXN1eV0qKS8sIFt7IHRva2VuOiAncmVnZXhwJywgYnJhY2tldDogJ0BjbG9zZScsIG5leHQ6ICdAcG9wJyB9LCAna2V5d29yZC5vdGhlciddXSxcbiAgICAgICAgXSxcbiAgICAgICAgcmVnZXhyYW5nZTogW1xuICAgICAgICAgICAgWy8tLywgJ3JlZ2V4cC5lc2NhcGUuY29udHJvbCddLFxuICAgICAgICAgICAgWy9cXF4vLCAncmVnZXhwLmludmFsaWQnXSxcbiAgICAgICAgICAgIFsvQHJlZ2V4cGVzYy8sICdyZWdleHAuZXNjYXBlJ10sXG4gICAgICAgICAgICBbL1teXFxdXS8sICdyZWdleHAnXSxcbiAgICAgICAgICAgIFsvXFxdLywgeyB0b2tlbjogJ3JlZ2V4cC5lc2NhcGUuY29udHJvbCcsIG5leHQ6ICdAcG9wJywgYnJhY2tldDogJ0BjbG9zZScgfV1cbiAgICAgICAgXSxcbiAgICAgICAgc3RyaW5nX2RvdWJsZTogW1xuICAgICAgICAgICAgWy9bXlxcXFxcIl0rLywgJ3N0cmluZyddLFxuICAgICAgICAgICAgWy9AZXNjYXBlcy8sICdzdHJpbmcuZXNjYXBlJ10sXG4gICAgICAgICAgICBbL1xcXFwuLywgJ3N0cmluZy5lc2NhcGUuaW52YWxpZCddLFxuICAgICAgICAgICAgWy9cIi8sICdzdHJpbmcnLCAnQHBvcCddXG4gICAgICAgIF0sXG4gICAgICAgIHN0cmluZ19zaW5nbGU6IFtcbiAgICAgICAgICAgIFsvW15cXFxcJ10rLywgJ3N0cmluZyddLFxuICAgICAgICAgICAgWy9AZXNjYXBlcy8sICdzdHJpbmcuZXNjYXBlJ10sXG4gICAgICAgICAgICBbL1xcXFwuLywgJ3N0cmluZy5lc2NhcGUuaW52YWxpZCddLFxuICAgICAgICAgICAgWy8nLywgJ3N0cmluZycsICdAcG9wJ11cbiAgICAgICAgXSxcbiAgICAgICAgc3RyaW5nX2JhY2t0aWNrOiBbXG4gICAgICAgICAgICBbL1xcJFxcey8sIHsgdG9rZW46ICdkZWxpbWl0ZXIuYnJhY2tldCcsIG5leHQ6ICdAYnJhY2tldENvdW50aW5nJyB9XSxcbiAgICAgICAgICAgIFsvW15cXFxcYCRdKy8sICdzdHJpbmcnXSxcbiAgICAgICAgICAgIFsvQGVzY2FwZXMvLCAnc3RyaW5nLmVzY2FwZSddLFxuICAgICAgICAgICAgWy9cXFxcLi8sICdzdHJpbmcuZXNjYXBlLmludmFsaWQnXSxcbiAgICAgICAgICAgIFsvYC8sICdzdHJpbmcnLCAnQHBvcCddXG4gICAgICAgIF0sXG4gICAgICAgIGJyYWNrZXRDb3VudGluZzogW1xuICAgICAgICAgICAgWy9cXHsvLCAnZGVsaW1pdGVyLmJyYWNrZXQnLCAnQGJyYWNrZXRDb3VudGluZyddLFxuICAgICAgICAgICAgWy9cXH0vLCAnZGVsaW1pdGVyLmJyYWNrZXQnLCAnQHBvcCddLFxuICAgICAgICAgICAgeyBpbmNsdWRlOiAnY29tbW9uJyB9XG4gICAgICAgIF0sXG4gICAgfSxcbn07XG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOyIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./node_modules/monaco-editor/esm/vs/basic-languages/typescript/typescript.js\n");

/***/ })

}]);