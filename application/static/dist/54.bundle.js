(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[54],{

/***/ "./node_modules/monaco-editor/esm/vs/basic-languages/st/st.js":
/*!********************************************************************!*\
  !*** ./node_modules/monaco-editor/esm/vs/basic-languages/st/st.js ***!
  \********************************************************************/
/*! exports provided: conf, language */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"conf\", function() { return conf; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"language\", function() { return language; });\n/*---------------------------------------------------------------------------------------------\n *  Copyright (c) Microsoft Corporation. All rights reserved.\n *  Licensed under the MIT License. See License.txt in the project root for license information.\n *--------------------------------------------------------------------------------------------*/\n\nvar conf = {\n    comments: {\n        lineComment: '//',\n        blockComment: ['(*', '*)'],\n    },\n    brackets: [\n        ['{', '}'],\n        ['[', ']'],\n        ['(', ')'],\n        ['var', 'end_var'],\n        ['var_input', 'end_var'],\n        ['var_output', 'end_var'],\n        ['var_in_out', 'end_var'],\n        ['var_temp', 'end_var'],\n        ['var_global', 'end_var'],\n        ['var_access', 'end_var'],\n        ['var_external', 'end_var'],\n        ['type', 'end_type'],\n        ['struct', 'end_struct'],\n        ['program', 'end_program'],\n        ['function', 'end_function'],\n        ['function_block', 'end_function_block'],\n        ['action', 'end_action'],\n        ['step', 'end_step'],\n        ['initial_step', 'end_step'],\n        ['transaction', 'end_transaction'],\n        ['configuration', 'end_configuration'],\n        ['tcp', 'end_tcp'],\n        ['recource', 'end_recource'],\n        ['channel', 'end_channel'],\n        ['library', 'end_library'],\n        ['folder', 'end_folder'],\n        ['binaries', 'end_binaries'],\n        ['includes', 'end_includes'],\n        ['sources', 'end_sources']\n    ],\n    autoClosingPairs: [\n        { open: '[', close: ']' },\n        { open: '{', close: '}' },\n        { open: '(', close: ')' },\n        { open: '/*', close: '*/' },\n        { open: '\\'', close: '\\'', notIn: ['string_sq'] },\n        { open: '\"', close: '\"', notIn: ['string_dq'] },\n        { open: 'var', close: 'end_var' },\n        { open: 'var_input', close: 'end_var' },\n        { open: 'var_output', close: 'end_var' },\n        { open: 'var_in_out', close: 'end_var' },\n        { open: 'var_temp', close: 'end_var' },\n        { open: 'var_global', close: 'end_var' },\n        { open: 'var_access', close: 'end_var' },\n        { open: 'var_external', close: 'end_var' },\n        { open: 'type', close: 'end_type' },\n        { open: 'struct', close: 'end_struct' },\n        { open: 'program', close: 'end_program' },\n        { open: 'function', close: 'end_function' },\n        { open: 'function_block', close: 'end_function_block' },\n        { open: 'action', close: 'end_action' },\n        { open: 'step', close: 'end_step' },\n        { open: 'initial_step', close: 'end_step' },\n        { open: 'transaction', close: 'end_transaction' },\n        { open: 'configuration', close: 'end_configuration' },\n        { open: 'tcp', close: 'end_tcp' },\n        { open: 'recource', close: 'end_recource' },\n        { open: 'channel', close: 'end_channel' },\n        { open: 'library', close: 'end_library' },\n        { open: 'folder', close: 'end_folder' },\n        { open: 'binaries', close: 'end_binaries' },\n        { open: 'includes', close: 'end_includes' },\n        { open: 'sources', close: 'end_sources' }\n    ],\n    surroundingPairs: [\n        { open: '{', close: '}' },\n        { open: '[', close: ']' },\n        { open: '(', close: ')' },\n        { open: '\"', close: '\"' },\n        { open: '\\'', close: '\\'' },\n        { open: 'var', close: 'end_var' },\n        { open: 'var_input', close: 'end_var' },\n        { open: 'var_output', close: 'end_var' },\n        { open: 'var_in_out', close: 'end_var' },\n        { open: 'var_temp', close: 'end_var' },\n        { open: 'var_global', close: 'end_var' },\n        { open: 'var_access', close: 'end_var' },\n        { open: 'var_external', close: 'end_var' },\n        { open: 'type', close: 'end_type' },\n        { open: 'struct', close: 'end_struct' },\n        { open: 'program', close: 'end_program' },\n        { open: 'function', close: 'end_function' },\n        { open: 'function_block', close: 'end_function_block' },\n        { open: 'action', close: 'end_action' },\n        { open: 'step', close: 'end_step' },\n        { open: 'initial_step', close: 'end_step' },\n        { open: 'transaction', close: 'end_transaction' },\n        { open: 'configuration', close: 'end_configuration' },\n        { open: 'tcp', close: 'end_tcp' },\n        { open: 'recource', close: 'end_recource' },\n        { open: 'channel', close: 'end_channel' },\n        { open: 'library', close: 'end_library' },\n        { open: 'folder', close: 'end_folder' },\n        { open: 'binaries', close: 'end_binaries' },\n        { open: 'includes', close: 'end_includes' },\n        { open: 'sources', close: 'end_sources' }\n    ],\n    folding: {\n        markers: {\n            start: new RegExp(\"^\\\\s*#pragma\\\\s+region\\\\b\"),\n            end: new RegExp(\"^\\\\s*#pragma\\\\s+endregion\\\\b\")\n        }\n    }\n};\nvar language = {\n    defaultToken: '',\n    tokenPostfix: '.st',\n    ignoreCase: true,\n    brackets: [\n        { token: 'delimiter.curly', open: '{', close: '}' },\n        { token: 'delimiter.parenthesis', open: '(', close: ')' },\n        { token: 'delimiter.square', open: '[', close: ']' }\n    ],\n    keywords: ['if', 'end_if', 'elsif', 'else', 'case', 'of', 'to',\n        'do', 'with', 'by', 'while', 'repeat', 'end_while', 'end_repeat', 'end_case',\n        'for', 'end_for', 'task', 'retain', 'non_retain', 'constant', 'with', 'at',\n        'exit', 'return', 'interval', 'priority', 'address', 'port', 'on_channel',\n        'then', 'iec', 'file', 'uses', 'version', 'packagetype', 'displayname',\n        'copyright', 'summary', 'vendor', 'common_source', 'from'],\n    constant: ['false', 'true', 'null'],\n    defineKeywords: [\n        'var', 'var_input', 'var_output', 'var_in_out', 'var_temp', 'var_global',\n        'var_access', 'var_external', 'end_var',\n        'type', 'end_type', 'struct', 'end_struct', 'program', 'end_program',\n        'function', 'end_function', 'function_block', 'end_function_block',\n        'configuration', 'end_configuration', 'tcp', 'end_tcp', 'recource',\n        'end_recource', 'channel', 'end_channel', 'library', 'end_library',\n        'folder', 'end_folder', 'binaries', 'end_binaries', 'includes',\n        'end_includes', 'sources', 'end_sources',\n        'action', 'end_action', 'step', 'initial_step', 'end_step', 'transaction', 'end_transaction'\n    ],\n    typeKeywords: ['int', 'sint', 'dint', 'lint', 'usint', 'uint', 'udint', 'ulint',\n        'real', 'lreal', 'time', 'date', 'time_of_day', 'date_and_time', 'string',\n        'bool', 'byte', 'world', 'dworld', 'array', 'pointer', 'lworld'],\n    operators: ['=', '>', '<', ':', ':=', '<=', '>=', '<>', '&', '+', '-', '*', '**',\n        'MOD', '^', 'or', 'and', 'not', 'xor', 'abs', 'acos', 'asin', 'atan', 'cos',\n        'exp', 'expt', 'ln', 'log', 'sin', 'sqrt', 'tan', 'sel', 'max', 'min', 'limit',\n        'mux', 'shl', 'shr', 'rol', 'ror', 'indexof', 'sizeof', 'adr', 'adrinst',\n        'bitadr', 'is_valid'],\n    builtinVariables: [],\n    builtinFunctions: ['sr', 'rs', 'tp', 'ton', 'tof', 'eq', 'ge', 'le', 'lt',\n        'ne', 'round', 'trunc', 'ctd', 'сtu', 'ctud', 'r_trig', 'f_trig',\n        'move', 'concat', 'delete', 'find', 'insert', 'left', 'len', 'replace',\n        'right', 'rtc'],\n    // we include these common regular expressions\n    symbols: /[=><!~?:&|+\\-*\\/\\^%]+/,\n    // C# style strings\n    escapes: /\\\\(?:[abfnrtv\\\\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,\n    // The main tokenizer for our languages\n    tokenizer: {\n        root: [\n            [/(\\.\\.)/, 'delimiter'],\n            [/\\b(16#[0-9A-Fa-f\\_]*)+\\b/, 'number.hex'],\n            [/\\b(2#[01\\_]+)+\\b/, 'number.binary'],\n            [/\\b(8#[0-9\\_]*)+\\b/, 'number.octal'],\n            [/\\d*\\.\\d+([eE][\\-+]?\\d+)?/, 'number.float'],\n            [/\\b(L?REAL)#[0-9\\_\\.e]+\\b/, 'number.float'],\n            [/\\b(BYTE|(?:D|L)?WORD|U?(?:S|D|L)?INT)#[0-9\\_]+\\b/, 'number'],\n            [/\\d+/, 'number'],\n            [/\\b(T|DT|TOD)#[0-9:-_shmyd]+\\b/, 'tag'],\n            [/\\%(I|Q|M)(X|B|W|D|L)[0-9\\.]+/, 'tag'],\n            [/\\%(I|Q|M)[0-9\\.]*/, 'tag'],\n            [/\\b[A-Za-z]{1,6}#[0-9]+/, 'tag'],\n            [/\\b(TO_|CTU_|CTD_|CTUD_|MUX_|SEL_)[A_Za-z]+\\b/, 'predefined'],\n            [/\\b[A_Za-z]+(_TO_)[A_Za-z]+\\b/, 'predefined'],\n            [/[;]/, 'delimiter'],\n            [/[.]/, { token: 'delimiter', next: '@params' }],\n            // identifiers and keywords\n            [/[a-zA-Z_]\\w*/, {\n                    cases: {\n                        '@operators': 'operators',\n                        '@keywords': 'keyword',\n                        '@typeKeywords': 'type',\n                        '@defineKeywords': 'variable',\n                        '@constant': 'constant',\n                        '@builtinVariables': 'predefined',\n                        '@builtinFunctions': 'predefined',\n                        '@default': 'identifier'\n                    }\n                }],\n            { include: '@whitespace' },\n            [/[{}()\\[\\]]/, '@brackets'],\n            [/\"([^\"\\\\]|\\\\.)*$/, 'string.invalid'],\n            [/\"/, { token: 'string.quote', bracket: '@open', next: '@string_dq' }],\n            [/'/, { token: 'string.quote', bracket: '@open', next: '@string_sq' }],\n            [/'[^\\\\']'/, 'string'],\n            [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],\n            [/'/, 'string.invalid']\n        ],\n        params: [\n            [/\\b[A-Za-z0-9_]+\\b(?=\\()/, { token: 'identifier', next: '@pop' }],\n            [/\\b[A-Za-z0-9_]+\\b/, 'variable.name', '@pop']\n        ],\n        comment: [\n            [/[^\\/*]+/, 'comment'],\n            [/\\/\\*/, 'comment', '@push'],\n            [\"\\\\*/\", 'comment', '@pop'],\n            [/[\\/*]/, 'comment']\n        ],\n        comment2: [\n            [/[^\\(*]+/, 'comment'],\n            [/\\(\\*/, 'comment', '@push'],\n            [\"\\\\*\\\\)\", 'comment', '@pop'],\n            [/[\\(*]/, 'comment']\n        ],\n        whitespace: [\n            [/[ \\t\\r\\n]+/, 'white'],\n            [/\\/\\/.*$/, 'comment'],\n            [/\\/\\*/, 'comment', '@comment'],\n            [/\\(\\*/, 'comment', '@comment2'],\n        ],\n        string_dq: [\n            [/[^\\\\\"]+/, 'string'],\n            [/@escapes/, 'string.escape'],\n            [/\\\\./, 'string.escape.invalid'],\n            [/\"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]\n        ],\n        string_sq: [\n            [/[^\\\\']+/, 'string'],\n            [/@escapes/, 'string.escape'],\n            [/\\\\./, 'string.escape.invalid'],\n            [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }]\n        ]\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9ub2RlX21vZHVsZXMvbW9uYWNvLWVkaXRvci9lc20vdnMvYmFzaWMtbGFuZ3VhZ2VzL3N0L3N0LmpzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL21vbmFjby1lZGl0b3IvZXNtL3ZzL2Jhc2ljLWxhbmd1YWdlcy9zdC9zdC5qcz9hY2MyIl0sInNvdXJjZXNDb250ZW50IjpbIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuJ3VzZSBzdHJpY3QnO1xuZXhwb3J0IHZhciBjb25mID0ge1xuICAgIGNvbW1lbnRzOiB7XG4gICAgICAgIGxpbmVDb21tZW50OiAnLy8nLFxuICAgICAgICBibG9ja0NvbW1lbnQ6IFsnKConLCAnKiknXSxcbiAgICB9LFxuICAgIGJyYWNrZXRzOiBbXG4gICAgICAgIFsneycsICd9J10sXG4gICAgICAgIFsnWycsICddJ10sXG4gICAgICAgIFsnKCcsICcpJ10sXG4gICAgICAgIFsndmFyJywgJ2VuZF92YXInXSxcbiAgICAgICAgWyd2YXJfaW5wdXQnLCAnZW5kX3ZhciddLFxuICAgICAgICBbJ3Zhcl9vdXRwdXQnLCAnZW5kX3ZhciddLFxuICAgICAgICBbJ3Zhcl9pbl9vdXQnLCAnZW5kX3ZhciddLFxuICAgICAgICBbJ3Zhcl90ZW1wJywgJ2VuZF92YXInXSxcbiAgICAgICAgWyd2YXJfZ2xvYmFsJywgJ2VuZF92YXInXSxcbiAgICAgICAgWyd2YXJfYWNjZXNzJywgJ2VuZF92YXInXSxcbiAgICAgICAgWyd2YXJfZXh0ZXJuYWwnLCAnZW5kX3ZhciddLFxuICAgICAgICBbJ3R5cGUnLCAnZW5kX3R5cGUnXSxcbiAgICAgICAgWydzdHJ1Y3QnLCAnZW5kX3N0cnVjdCddLFxuICAgICAgICBbJ3Byb2dyYW0nLCAnZW5kX3Byb2dyYW0nXSxcbiAgICAgICAgWydmdW5jdGlvbicsICdlbmRfZnVuY3Rpb24nXSxcbiAgICAgICAgWydmdW5jdGlvbl9ibG9jaycsICdlbmRfZnVuY3Rpb25fYmxvY2snXSxcbiAgICAgICAgWydhY3Rpb24nLCAnZW5kX2FjdGlvbiddLFxuICAgICAgICBbJ3N0ZXAnLCAnZW5kX3N0ZXAnXSxcbiAgICAgICAgWydpbml0aWFsX3N0ZXAnLCAnZW5kX3N0ZXAnXSxcbiAgICAgICAgWyd0cmFuc2FjdGlvbicsICdlbmRfdHJhbnNhY3Rpb24nXSxcbiAgICAgICAgWydjb25maWd1cmF0aW9uJywgJ2VuZF9jb25maWd1cmF0aW9uJ10sXG4gICAgICAgIFsndGNwJywgJ2VuZF90Y3AnXSxcbiAgICAgICAgWydyZWNvdXJjZScsICdlbmRfcmVjb3VyY2UnXSxcbiAgICAgICAgWydjaGFubmVsJywgJ2VuZF9jaGFubmVsJ10sXG4gICAgICAgIFsnbGlicmFyeScsICdlbmRfbGlicmFyeSddLFxuICAgICAgICBbJ2ZvbGRlcicsICdlbmRfZm9sZGVyJ10sXG4gICAgICAgIFsnYmluYXJpZXMnLCAnZW5kX2JpbmFyaWVzJ10sXG4gICAgICAgIFsnaW5jbHVkZXMnLCAnZW5kX2luY2x1ZGVzJ10sXG4gICAgICAgIFsnc291cmNlcycsICdlbmRfc291cmNlcyddXG4gICAgXSxcbiAgICBhdXRvQ2xvc2luZ1BhaXJzOiBbXG4gICAgICAgIHsgb3BlbjogJ1snLCBjbG9zZTogJ10nIH0sXG4gICAgICAgIHsgb3BlbjogJ3snLCBjbG9zZTogJ30nIH0sXG4gICAgICAgIHsgb3BlbjogJygnLCBjbG9zZTogJyknIH0sXG4gICAgICAgIHsgb3BlbjogJy8qJywgY2xvc2U6ICcqLycgfSxcbiAgICAgICAgeyBvcGVuOiAnXFwnJywgY2xvc2U6ICdcXCcnLCBub3RJbjogWydzdHJpbmdfc3EnXSB9LFxuICAgICAgICB7IG9wZW46ICdcIicsIGNsb3NlOiAnXCInLCBub3RJbjogWydzdHJpbmdfZHEnXSB9LFxuICAgICAgICB7IG9wZW46ICd2YXInLCBjbG9zZTogJ2VuZF92YXInIH0sXG4gICAgICAgIHsgb3BlbjogJ3Zhcl9pbnB1dCcsIGNsb3NlOiAnZW5kX3ZhcicgfSxcbiAgICAgICAgeyBvcGVuOiAndmFyX291dHB1dCcsIGNsb3NlOiAnZW5kX3ZhcicgfSxcbiAgICAgICAgeyBvcGVuOiAndmFyX2luX291dCcsIGNsb3NlOiAnZW5kX3ZhcicgfSxcbiAgICAgICAgeyBvcGVuOiAndmFyX3RlbXAnLCBjbG9zZTogJ2VuZF92YXInIH0sXG4gICAgICAgIHsgb3BlbjogJ3Zhcl9nbG9iYWwnLCBjbG9zZTogJ2VuZF92YXInIH0sXG4gICAgICAgIHsgb3BlbjogJ3Zhcl9hY2Nlc3MnLCBjbG9zZTogJ2VuZF92YXInIH0sXG4gICAgICAgIHsgb3BlbjogJ3Zhcl9leHRlcm5hbCcsIGNsb3NlOiAnZW5kX3ZhcicgfSxcbiAgICAgICAgeyBvcGVuOiAndHlwZScsIGNsb3NlOiAnZW5kX3R5cGUnIH0sXG4gICAgICAgIHsgb3BlbjogJ3N0cnVjdCcsIGNsb3NlOiAnZW5kX3N0cnVjdCcgfSxcbiAgICAgICAgeyBvcGVuOiAncHJvZ3JhbScsIGNsb3NlOiAnZW5kX3Byb2dyYW0nIH0sXG4gICAgICAgIHsgb3BlbjogJ2Z1bmN0aW9uJywgY2xvc2U6ICdlbmRfZnVuY3Rpb24nIH0sXG4gICAgICAgIHsgb3BlbjogJ2Z1bmN0aW9uX2Jsb2NrJywgY2xvc2U6ICdlbmRfZnVuY3Rpb25fYmxvY2snIH0sXG4gICAgICAgIHsgb3BlbjogJ2FjdGlvbicsIGNsb3NlOiAnZW5kX2FjdGlvbicgfSxcbiAgICAgICAgeyBvcGVuOiAnc3RlcCcsIGNsb3NlOiAnZW5kX3N0ZXAnIH0sXG4gICAgICAgIHsgb3BlbjogJ2luaXRpYWxfc3RlcCcsIGNsb3NlOiAnZW5kX3N0ZXAnIH0sXG4gICAgICAgIHsgb3BlbjogJ3RyYW5zYWN0aW9uJywgY2xvc2U6ICdlbmRfdHJhbnNhY3Rpb24nIH0sXG4gICAgICAgIHsgb3BlbjogJ2NvbmZpZ3VyYXRpb24nLCBjbG9zZTogJ2VuZF9jb25maWd1cmF0aW9uJyB9LFxuICAgICAgICB7IG9wZW46ICd0Y3AnLCBjbG9zZTogJ2VuZF90Y3AnIH0sXG4gICAgICAgIHsgb3BlbjogJ3JlY291cmNlJywgY2xvc2U6ICdlbmRfcmVjb3VyY2UnIH0sXG4gICAgICAgIHsgb3BlbjogJ2NoYW5uZWwnLCBjbG9zZTogJ2VuZF9jaGFubmVsJyB9LFxuICAgICAgICB7IG9wZW46ICdsaWJyYXJ5JywgY2xvc2U6ICdlbmRfbGlicmFyeScgfSxcbiAgICAgICAgeyBvcGVuOiAnZm9sZGVyJywgY2xvc2U6ICdlbmRfZm9sZGVyJyB9LFxuICAgICAgICB7IG9wZW46ICdiaW5hcmllcycsIGNsb3NlOiAnZW5kX2JpbmFyaWVzJyB9LFxuICAgICAgICB7IG9wZW46ICdpbmNsdWRlcycsIGNsb3NlOiAnZW5kX2luY2x1ZGVzJyB9LFxuICAgICAgICB7IG9wZW46ICdzb3VyY2VzJywgY2xvc2U6ICdlbmRfc291cmNlcycgfVxuICAgIF0sXG4gICAgc3Vycm91bmRpbmdQYWlyczogW1xuICAgICAgICB7IG9wZW46ICd7JywgY2xvc2U6ICd9JyB9LFxuICAgICAgICB7IG9wZW46ICdbJywgY2xvc2U6ICddJyB9LFxuICAgICAgICB7IG9wZW46ICcoJywgY2xvc2U6ICcpJyB9LFxuICAgICAgICB7IG9wZW46ICdcIicsIGNsb3NlOiAnXCInIH0sXG4gICAgICAgIHsgb3BlbjogJ1xcJycsIGNsb3NlOiAnXFwnJyB9LFxuICAgICAgICB7IG9wZW46ICd2YXInLCBjbG9zZTogJ2VuZF92YXInIH0sXG4gICAgICAgIHsgb3BlbjogJ3Zhcl9pbnB1dCcsIGNsb3NlOiAnZW5kX3ZhcicgfSxcbiAgICAgICAgeyBvcGVuOiAndmFyX291dHB1dCcsIGNsb3NlOiAnZW5kX3ZhcicgfSxcbiAgICAgICAgeyBvcGVuOiAndmFyX2luX291dCcsIGNsb3NlOiAnZW5kX3ZhcicgfSxcbiAgICAgICAgeyBvcGVuOiAndmFyX3RlbXAnLCBjbG9zZTogJ2VuZF92YXInIH0sXG4gICAgICAgIHsgb3BlbjogJ3Zhcl9nbG9iYWwnLCBjbG9zZTogJ2VuZF92YXInIH0sXG4gICAgICAgIHsgb3BlbjogJ3Zhcl9hY2Nlc3MnLCBjbG9zZTogJ2VuZF92YXInIH0sXG4gICAgICAgIHsgb3BlbjogJ3Zhcl9leHRlcm5hbCcsIGNsb3NlOiAnZW5kX3ZhcicgfSxcbiAgICAgICAgeyBvcGVuOiAndHlwZScsIGNsb3NlOiAnZW5kX3R5cGUnIH0sXG4gICAgICAgIHsgb3BlbjogJ3N0cnVjdCcsIGNsb3NlOiAnZW5kX3N0cnVjdCcgfSxcbiAgICAgICAgeyBvcGVuOiAncHJvZ3JhbScsIGNsb3NlOiAnZW5kX3Byb2dyYW0nIH0sXG4gICAgICAgIHsgb3BlbjogJ2Z1bmN0aW9uJywgY2xvc2U6ICdlbmRfZnVuY3Rpb24nIH0sXG4gICAgICAgIHsgb3BlbjogJ2Z1bmN0aW9uX2Jsb2NrJywgY2xvc2U6ICdlbmRfZnVuY3Rpb25fYmxvY2snIH0sXG4gICAgICAgIHsgb3BlbjogJ2FjdGlvbicsIGNsb3NlOiAnZW5kX2FjdGlvbicgfSxcbiAgICAgICAgeyBvcGVuOiAnc3RlcCcsIGNsb3NlOiAnZW5kX3N0ZXAnIH0sXG4gICAgICAgIHsgb3BlbjogJ2luaXRpYWxfc3RlcCcsIGNsb3NlOiAnZW5kX3N0ZXAnIH0sXG4gICAgICAgIHsgb3BlbjogJ3RyYW5zYWN0aW9uJywgY2xvc2U6ICdlbmRfdHJhbnNhY3Rpb24nIH0sXG4gICAgICAgIHsgb3BlbjogJ2NvbmZpZ3VyYXRpb24nLCBjbG9zZTogJ2VuZF9jb25maWd1cmF0aW9uJyB9LFxuICAgICAgICB7IG9wZW46ICd0Y3AnLCBjbG9zZTogJ2VuZF90Y3AnIH0sXG4gICAgICAgIHsgb3BlbjogJ3JlY291cmNlJywgY2xvc2U6ICdlbmRfcmVjb3VyY2UnIH0sXG4gICAgICAgIHsgb3BlbjogJ2NoYW5uZWwnLCBjbG9zZTogJ2VuZF9jaGFubmVsJyB9LFxuICAgICAgICB7IG9wZW46ICdsaWJyYXJ5JywgY2xvc2U6ICdlbmRfbGlicmFyeScgfSxcbiAgICAgICAgeyBvcGVuOiAnZm9sZGVyJywgY2xvc2U6ICdlbmRfZm9sZGVyJyB9LFxuICAgICAgICB7IG9wZW46ICdiaW5hcmllcycsIGNsb3NlOiAnZW5kX2JpbmFyaWVzJyB9LFxuICAgICAgICB7IG9wZW46ICdpbmNsdWRlcycsIGNsb3NlOiAnZW5kX2luY2x1ZGVzJyB9LFxuICAgICAgICB7IG9wZW46ICdzb3VyY2VzJywgY2xvc2U6ICdlbmRfc291cmNlcycgfVxuICAgIF0sXG4gICAgZm9sZGluZzoge1xuICAgICAgICBtYXJrZXJzOiB7XG4gICAgICAgICAgICBzdGFydDogbmV3IFJlZ0V4cChcIl5cXFxccyojcHJhZ21hXFxcXHMrcmVnaW9uXFxcXGJcIiksXG4gICAgICAgICAgICBlbmQ6IG5ldyBSZWdFeHAoXCJeXFxcXHMqI3ByYWdtYVxcXFxzK2VuZHJlZ2lvblxcXFxiXCIpXG4gICAgICAgIH1cbiAgICB9XG59O1xuZXhwb3J0IHZhciBsYW5ndWFnZSA9IHtcbiAgICBkZWZhdWx0VG9rZW46ICcnLFxuICAgIHRva2VuUG9zdGZpeDogJy5zdCcsXG4gICAgaWdub3JlQ2FzZTogdHJ1ZSxcbiAgICBicmFja2V0czogW1xuICAgICAgICB7IHRva2VuOiAnZGVsaW1pdGVyLmN1cmx5Jywgb3BlbjogJ3snLCBjbG9zZTogJ30nIH0sXG4gICAgICAgIHsgdG9rZW46ICdkZWxpbWl0ZXIucGFyZW50aGVzaXMnLCBvcGVuOiAnKCcsIGNsb3NlOiAnKScgfSxcbiAgICAgICAgeyB0b2tlbjogJ2RlbGltaXRlci5zcXVhcmUnLCBvcGVuOiAnWycsIGNsb3NlOiAnXScgfVxuICAgIF0sXG4gICAga2V5d29yZHM6IFsnaWYnLCAnZW5kX2lmJywgJ2Vsc2lmJywgJ2Vsc2UnLCAnY2FzZScsICdvZicsICd0bycsXG4gICAgICAgICdkbycsICd3aXRoJywgJ2J5JywgJ3doaWxlJywgJ3JlcGVhdCcsICdlbmRfd2hpbGUnLCAnZW5kX3JlcGVhdCcsICdlbmRfY2FzZScsXG4gICAgICAgICdmb3InLCAnZW5kX2ZvcicsICd0YXNrJywgJ3JldGFpbicsICdub25fcmV0YWluJywgJ2NvbnN0YW50JywgJ3dpdGgnLCAnYXQnLFxuICAgICAgICAnZXhpdCcsICdyZXR1cm4nLCAnaW50ZXJ2YWwnLCAncHJpb3JpdHknLCAnYWRkcmVzcycsICdwb3J0JywgJ29uX2NoYW5uZWwnLFxuICAgICAgICAndGhlbicsICdpZWMnLCAnZmlsZScsICd1c2VzJywgJ3ZlcnNpb24nLCAncGFja2FnZXR5cGUnLCAnZGlzcGxheW5hbWUnLFxuICAgICAgICAnY29weXJpZ2h0JywgJ3N1bW1hcnknLCAndmVuZG9yJywgJ2NvbW1vbl9zb3VyY2UnLCAnZnJvbSddLFxuICAgIGNvbnN0YW50OiBbJ2ZhbHNlJywgJ3RydWUnLCAnbnVsbCddLFxuICAgIGRlZmluZUtleXdvcmRzOiBbXG4gICAgICAgICd2YXInLCAndmFyX2lucHV0JywgJ3Zhcl9vdXRwdXQnLCAndmFyX2luX291dCcsICd2YXJfdGVtcCcsICd2YXJfZ2xvYmFsJyxcbiAgICAgICAgJ3Zhcl9hY2Nlc3MnLCAndmFyX2V4dGVybmFsJywgJ2VuZF92YXInLFxuICAgICAgICAndHlwZScsICdlbmRfdHlwZScsICdzdHJ1Y3QnLCAnZW5kX3N0cnVjdCcsICdwcm9ncmFtJywgJ2VuZF9wcm9ncmFtJyxcbiAgICAgICAgJ2Z1bmN0aW9uJywgJ2VuZF9mdW5jdGlvbicsICdmdW5jdGlvbl9ibG9jaycsICdlbmRfZnVuY3Rpb25fYmxvY2snLFxuICAgICAgICAnY29uZmlndXJhdGlvbicsICdlbmRfY29uZmlndXJhdGlvbicsICd0Y3AnLCAnZW5kX3RjcCcsICdyZWNvdXJjZScsXG4gICAgICAgICdlbmRfcmVjb3VyY2UnLCAnY2hhbm5lbCcsICdlbmRfY2hhbm5lbCcsICdsaWJyYXJ5JywgJ2VuZF9saWJyYXJ5JyxcbiAgICAgICAgJ2ZvbGRlcicsICdlbmRfZm9sZGVyJywgJ2JpbmFyaWVzJywgJ2VuZF9iaW5hcmllcycsICdpbmNsdWRlcycsXG4gICAgICAgICdlbmRfaW5jbHVkZXMnLCAnc291cmNlcycsICdlbmRfc291cmNlcycsXG4gICAgICAgICdhY3Rpb24nLCAnZW5kX2FjdGlvbicsICdzdGVwJywgJ2luaXRpYWxfc3RlcCcsICdlbmRfc3RlcCcsICd0cmFuc2FjdGlvbicsICdlbmRfdHJhbnNhY3Rpb24nXG4gICAgXSxcbiAgICB0eXBlS2V5d29yZHM6IFsnaW50JywgJ3NpbnQnLCAnZGludCcsICdsaW50JywgJ3VzaW50JywgJ3VpbnQnLCAndWRpbnQnLCAndWxpbnQnLFxuICAgICAgICAncmVhbCcsICdscmVhbCcsICd0aW1lJywgJ2RhdGUnLCAndGltZV9vZl9kYXknLCAnZGF0ZV9hbmRfdGltZScsICdzdHJpbmcnLFxuICAgICAgICAnYm9vbCcsICdieXRlJywgJ3dvcmxkJywgJ2R3b3JsZCcsICdhcnJheScsICdwb2ludGVyJywgJ2x3b3JsZCddLFxuICAgIG9wZXJhdG9yczogWyc9JywgJz4nLCAnPCcsICc6JywgJzo9JywgJzw9JywgJz49JywgJzw+JywgJyYnLCAnKycsICctJywgJyonLCAnKionLFxuICAgICAgICAnTU9EJywgJ14nLCAnb3InLCAnYW5kJywgJ25vdCcsICd4b3InLCAnYWJzJywgJ2Fjb3MnLCAnYXNpbicsICdhdGFuJywgJ2NvcycsXG4gICAgICAgICdleHAnLCAnZXhwdCcsICdsbicsICdsb2cnLCAnc2luJywgJ3NxcnQnLCAndGFuJywgJ3NlbCcsICdtYXgnLCAnbWluJywgJ2xpbWl0JyxcbiAgICAgICAgJ211eCcsICdzaGwnLCAnc2hyJywgJ3JvbCcsICdyb3InLCAnaW5kZXhvZicsICdzaXplb2YnLCAnYWRyJywgJ2Fkcmluc3QnLFxuICAgICAgICAnYml0YWRyJywgJ2lzX3ZhbGlkJ10sXG4gICAgYnVpbHRpblZhcmlhYmxlczogW10sXG4gICAgYnVpbHRpbkZ1bmN0aW9uczogWydzcicsICdycycsICd0cCcsICd0b24nLCAndG9mJywgJ2VxJywgJ2dlJywgJ2xlJywgJ2x0JyxcbiAgICAgICAgJ25lJywgJ3JvdW5kJywgJ3RydW5jJywgJ2N0ZCcsICfRgXR1JywgJ2N0dWQnLCAncl90cmlnJywgJ2ZfdHJpZycsXG4gICAgICAgICdtb3ZlJywgJ2NvbmNhdCcsICdkZWxldGUnLCAnZmluZCcsICdpbnNlcnQnLCAnbGVmdCcsICdsZW4nLCAncmVwbGFjZScsXG4gICAgICAgICdyaWdodCcsICdydGMnXSxcbiAgICAvLyB3ZSBpbmNsdWRlIHRoZXNlIGNvbW1vbiByZWd1bGFyIGV4cHJlc3Npb25zXG4gICAgc3ltYm9sczogL1s9Pjwhfj86JnwrXFwtKlxcL1xcXiVdKy8sXG4gICAgLy8gQyMgc3R5bGUgc3RyaW5nc1xuICAgIGVzY2FwZXM6IC9cXFxcKD86W2FiZm5ydHZcXFxcXCInXXx4WzAtOUEtRmEtZl17MSw0fXx1WzAtOUEtRmEtZl17NH18VVswLTlBLUZhLWZdezh9KS8sXG4gICAgLy8gVGhlIG1haW4gdG9rZW5pemVyIGZvciBvdXIgbGFuZ3VhZ2VzXG4gICAgdG9rZW5pemVyOiB7XG4gICAgICAgIHJvb3Q6IFtcbiAgICAgICAgICAgIFsvKFxcLlxcLikvLCAnZGVsaW1pdGVyJ10sXG4gICAgICAgICAgICBbL1xcYigxNiNbMC05QS1GYS1mXFxfXSopK1xcYi8sICdudW1iZXIuaGV4J10sXG4gICAgICAgICAgICBbL1xcYigyI1swMVxcX10rKStcXGIvLCAnbnVtYmVyLmJpbmFyeSddLFxuICAgICAgICAgICAgWy9cXGIoOCNbMC05XFxfXSopK1xcYi8sICdudW1iZXIub2N0YWwnXSxcbiAgICAgICAgICAgIFsvXFxkKlxcLlxcZCsoW2VFXVtcXC0rXT9cXGQrKT8vLCAnbnVtYmVyLmZsb2F0J10sXG4gICAgICAgICAgICBbL1xcYihMP1JFQUwpI1swLTlcXF9cXC5lXStcXGIvLCAnbnVtYmVyLmZsb2F0J10sXG4gICAgICAgICAgICBbL1xcYihCWVRFfCg/OkR8TCk/V09SRHxVPyg/OlN8RHxMKT9JTlQpI1swLTlcXF9dK1xcYi8sICdudW1iZXInXSxcbiAgICAgICAgICAgIFsvXFxkKy8sICdudW1iZXInXSxcbiAgICAgICAgICAgIFsvXFxiKFR8RFR8VE9EKSNbMC05Oi1fc2hteWRdK1xcYi8sICd0YWcnXSxcbiAgICAgICAgICAgIFsvXFwlKEl8UXxNKShYfEJ8V3xEfEwpWzAtOVxcLl0rLywgJ3RhZyddLFxuICAgICAgICAgICAgWy9cXCUoSXxRfE0pWzAtOVxcLl0qLywgJ3RhZyddLFxuICAgICAgICAgICAgWy9cXGJbQS1aYS16XXsxLDZ9I1swLTldKy8sICd0YWcnXSxcbiAgICAgICAgICAgIFsvXFxiKFRPX3xDVFVffENURF98Q1RVRF98TVVYX3xTRUxfKVtBX1phLXpdK1xcYi8sICdwcmVkZWZpbmVkJ10sXG4gICAgICAgICAgICBbL1xcYltBX1phLXpdKyhfVE9fKVtBX1phLXpdK1xcYi8sICdwcmVkZWZpbmVkJ10sXG4gICAgICAgICAgICBbL1s7XS8sICdkZWxpbWl0ZXInXSxcbiAgICAgICAgICAgIFsvWy5dLywgeyB0b2tlbjogJ2RlbGltaXRlcicsIG5leHQ6ICdAcGFyYW1zJyB9XSxcbiAgICAgICAgICAgIC8vIGlkZW50aWZpZXJzIGFuZCBrZXl3b3Jkc1xuICAgICAgICAgICAgWy9bYS16QS1aX11cXHcqLywge1xuICAgICAgICAgICAgICAgICAgICBjYXNlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0BvcGVyYXRvcnMnOiAnb3BlcmF0b3JzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdAa2V5d29yZHMnOiAna2V5d29yZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnQHR5cGVLZXl3b3Jkcyc6ICd0eXBlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdAZGVmaW5lS2V5d29yZHMnOiAndmFyaWFibGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0Bjb25zdGFudCc6ICdjb25zdGFudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGJ1aWx0aW5WYXJpYWJsZXMnOiAncHJlZGVmaW5lZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGJ1aWx0aW5GdW5jdGlvbnMnOiAncHJlZGVmaW5lZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGRlZmF1bHQnOiAnaWRlbnRpZmllcidcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgeyBpbmNsdWRlOiAnQHdoaXRlc3BhY2UnIH0sXG4gICAgICAgICAgICBbL1t7fSgpXFxbXFxdXS8sICdAYnJhY2tldHMnXSxcbiAgICAgICAgICAgIFsvXCIoW15cIlxcXFxdfFxcXFwuKSokLywgJ3N0cmluZy5pbnZhbGlkJ10sXG4gICAgICAgICAgICBbL1wiLywgeyB0b2tlbjogJ3N0cmluZy5xdW90ZScsIGJyYWNrZXQ6ICdAb3BlbicsIG5leHQ6ICdAc3RyaW5nX2RxJyB9XSxcbiAgICAgICAgICAgIFsvJy8sIHsgdG9rZW46ICdzdHJpbmcucXVvdGUnLCBicmFja2V0OiAnQG9wZW4nLCBuZXh0OiAnQHN0cmluZ19zcScgfV0sXG4gICAgICAgICAgICBbLydbXlxcXFwnXScvLCAnc3RyaW5nJ10sXG4gICAgICAgICAgICBbLygnKShAZXNjYXBlcykoJykvLCBbJ3N0cmluZycsICdzdHJpbmcuZXNjYXBlJywgJ3N0cmluZyddXSxcbiAgICAgICAgICAgIFsvJy8sICdzdHJpbmcuaW52YWxpZCddXG4gICAgICAgIF0sXG4gICAgICAgIHBhcmFtczogW1xuICAgICAgICAgICAgWy9cXGJbQS1aYS16MC05X10rXFxiKD89XFwoKS8sIHsgdG9rZW46ICdpZGVudGlmaWVyJywgbmV4dDogJ0Bwb3AnIH1dLFxuICAgICAgICAgICAgWy9cXGJbQS1aYS16MC05X10rXFxiLywgJ3ZhcmlhYmxlLm5hbWUnLCAnQHBvcCddXG4gICAgICAgIF0sXG4gICAgICAgIGNvbW1lbnQ6IFtcbiAgICAgICAgICAgIFsvW15cXC8qXSsvLCAnY29tbWVudCddLFxuICAgICAgICAgICAgWy9cXC9cXCovLCAnY29tbWVudCcsICdAcHVzaCddLFxuICAgICAgICAgICAgW1wiXFxcXCovXCIsICdjb21tZW50JywgJ0Bwb3AnXSxcbiAgICAgICAgICAgIFsvW1xcLypdLywgJ2NvbW1lbnQnXVxuICAgICAgICBdLFxuICAgICAgICBjb21tZW50MjogW1xuICAgICAgICAgICAgWy9bXlxcKCpdKy8sICdjb21tZW50J10sXG4gICAgICAgICAgICBbL1xcKFxcKi8sICdjb21tZW50JywgJ0BwdXNoJ10sXG4gICAgICAgICAgICBbXCJcXFxcKlxcXFwpXCIsICdjb21tZW50JywgJ0Bwb3AnXSxcbiAgICAgICAgICAgIFsvW1xcKCpdLywgJ2NvbW1lbnQnXVxuICAgICAgICBdLFxuICAgICAgICB3aGl0ZXNwYWNlOiBbXG4gICAgICAgICAgICBbL1sgXFx0XFxyXFxuXSsvLCAnd2hpdGUnXSxcbiAgICAgICAgICAgIFsvXFwvXFwvLiokLywgJ2NvbW1lbnQnXSxcbiAgICAgICAgICAgIFsvXFwvXFwqLywgJ2NvbW1lbnQnLCAnQGNvbW1lbnQnXSxcbiAgICAgICAgICAgIFsvXFwoXFwqLywgJ2NvbW1lbnQnLCAnQGNvbW1lbnQyJ10sXG4gICAgICAgIF0sXG4gICAgICAgIHN0cmluZ19kcTogW1xuICAgICAgICAgICAgWy9bXlxcXFxcIl0rLywgJ3N0cmluZyddLFxuICAgICAgICAgICAgWy9AZXNjYXBlcy8sICdzdHJpbmcuZXNjYXBlJ10sXG4gICAgICAgICAgICBbL1xcXFwuLywgJ3N0cmluZy5lc2NhcGUuaW52YWxpZCddLFxuICAgICAgICAgICAgWy9cIi8sIHsgdG9rZW46ICdzdHJpbmcucXVvdGUnLCBicmFja2V0OiAnQGNsb3NlJywgbmV4dDogJ0Bwb3AnIH1dXG4gICAgICAgIF0sXG4gICAgICAgIHN0cmluZ19zcTogW1xuICAgICAgICAgICAgWy9bXlxcXFwnXSsvLCAnc3RyaW5nJ10sXG4gICAgICAgICAgICBbL0Blc2NhcGVzLywgJ3N0cmluZy5lc2NhcGUnXSxcbiAgICAgICAgICAgIFsvXFxcXC4vLCAnc3RyaW5nLmVzY2FwZS5pbnZhbGlkJ10sXG4gICAgICAgICAgICBbLycvLCB7IHRva2VuOiAnc3RyaW5nLnF1b3RlJywgYnJhY2tldDogJ0BjbG9zZScsIG5leHQ6ICdAcG9wJyB9XVxuICAgICAgICBdXG4gICAgfVxufTtcbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTsiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./node_modules/monaco-editor/esm/vs/basic-languages/st/st.js\n");

/***/ })

}]);