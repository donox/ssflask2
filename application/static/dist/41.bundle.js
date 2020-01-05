(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[41],{

/***/ "./node_modules/monaco-editor/esm/vs/basic-languages/r/r.js":
/*!******************************************************************!*\
  !*** ./node_modules/monaco-editor/esm/vs/basic-languages/r/r.js ***!
  \******************************************************************/
/*! exports provided: conf, language */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"conf\", function() { return conf; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"language\", function() { return language; });\n/*---------------------------------------------------------------------------------------------\n *  Copyright (c) Microsoft Corporation. All rights reserved.\n *  Licensed under the MIT License. See License.txt in the project root for license information.\n *--------------------------------------------------------------------------------------------*/\n\nvar conf = {\n    comments: {\n        lineComment: '#'\n    },\n    brackets: [\n        ['{', '}'],\n        ['[', ']'],\n        ['(', ')']\n    ],\n    autoClosingPairs: [\n        { open: '{', close: '}' },\n        { open: '[', close: ']' },\n        { open: '(', close: ')' },\n        { open: '\"', close: '\"' },\n    ],\n    surroundingPairs: [\n        { open: '{', close: '}' },\n        { open: '[', close: ']' },\n        { open: '(', close: ')' },\n        { open: '\"', close: '\"' },\n    ]\n};\nvar language = {\n    defaultToken: '',\n    tokenPostfix: '.r',\n    roxygen: [\n        '@param',\n        '@return',\n        '@name',\n        '@rdname',\n        '@examples',\n        '@include',\n        '@docType',\n        '@S3method',\n        '@TODO',\n        '@aliases',\n        '@alias',\n        '@assignee',\n        '@author',\n        '@callGraphDepth',\n        '@callGraph',\n        '@callGraphPrimitives',\n        '@concept',\n        '@exportClass',\n        '@exportMethod',\n        '@exportPattern',\n        '@export',\n        '@formals',\n        '@format',\n        '@importClassesFrom',\n        '@importFrom',\n        '@importMethodsFrom',\n        '@import',\n        '@keywords',\n        '@method',\n        '@nord',\n        '@note',\n        '@references',\n        '@seealso',\n        '@setClass',\n        '@slot',\n        '@source',\n        '@title',\n        '@usage'\n    ],\n    constants: [\n        'NULL',\n        'FALSE',\n        'TRUE',\n        'NA',\n        'Inf',\n        'NaN ',\n        'NA_integer_',\n        'NA_real_',\n        'NA_complex_',\n        'NA_character_ ',\n        'T',\n        'F',\n        'LETTERS',\n        'letters',\n        'month.abb',\n        'month.name',\n        'pi',\n        'R.version.string'\n    ],\n    keywords: [\n        'break',\n        'next',\n        'return',\n        'if',\n        'else',\n        'for',\n        'in',\n        'repeat',\n        'while',\n        'array',\n        'category',\n        'character',\n        'complex',\n        'double',\n        'function',\n        'integer',\n        'list',\n        'logical',\n        'matrix',\n        'numeric',\n        'vector',\n        'data.frame',\n        'factor',\n        'library',\n        'require',\n        'attach',\n        'detach',\n        'source'\n    ],\n    special: [\n        '\\\\n',\n        '\\\\r',\n        '\\\\t',\n        '\\\\b',\n        '\\\\a',\n        '\\\\f',\n        '\\\\v',\n        '\\\\\\'',\n        '\\\\\"',\n        '\\\\\\\\'\n    ],\n    brackets: [\n        { open: '{', close: '}', token: 'delimiter.curly' },\n        { open: '[', close: ']', token: 'delimiter.bracket' },\n        { open: '(', close: ')', token: 'delimiter.parenthesis' }\n    ],\n    tokenizer: {\n        root: [\n            { include: '@numbers' },\n            { include: '@strings' },\n            [/[{}\\[\\]()]/, '@brackets'],\n            { include: '@operators' },\n            [/#'/, 'comment.doc', '@roxygen'],\n            [/(^#.*$)/, 'comment'],\n            [/\\s+/, 'white'],\n            [/[,:;]/, 'delimiter'],\n            [/@[a-zA-Z]\\w*/, 'tag'],\n            [/[a-zA-Z]\\w*/, {\n                    cases: {\n                        '@keywords': 'keyword',\n                        '@constants': 'constant',\n                        '@default': 'identifier'\n                    }\n                }]\n        ],\n        // Recognize Roxygen comments\n        roxygen: [\n            [/@\\w+/, {\n                    cases: {\n                        '@roxygen': 'tag',\n                        '@eos': { token: 'comment.doc', next: '@pop' },\n                        '@default': 'comment.doc'\n                    }\n                }],\n            [/\\s+/, {\n                    cases: {\n                        '@eos': { token: 'comment.doc', next: '@pop' },\n                        '@default': 'comment.doc'\n                    }\n                }],\n            [/.*/, { token: 'comment.doc', next: '@pop' }]\n        ],\n        // Recognize positives, negatives, decimals, imaginaries, and scientific notation\n        numbers: [\n            [/0[xX][0-9a-fA-F]+/, 'number.hex'],\n            [/-?(\\d*\\.)?\\d+([eE][+\\-]?\\d+)?/, 'number']\n        ],\n        // Recognize operators\n        operators: [\n            [/<{1,2}-/, 'operator'],\n            [/->{1,2}/, 'operator'],\n            [/%[^%\\s]+%/, 'operator'],\n            [/\\*\\*/, 'operator'],\n            [/%%/, 'operator'],\n            [/&&/, 'operator'],\n            [/\\|\\|/, 'operator'],\n            [/<</, 'operator'],\n            [/>>/, 'operator'],\n            [/[-+=&|!<>^~*/:$]/, 'operator']\n        ],\n        // Recognize strings, including those broken across lines\n        strings: [\n            [/'/, 'string.escape', '@stringBody'],\n            [/\"/, 'string.escape', '@dblStringBody']\n        ],\n        stringBody: [\n            [/\\\\./, {\n                    cases: {\n                        '@special': 'string',\n                        '@default': 'error-token'\n                    }\n                }],\n            [/'/, 'string.escape', '@popall'],\n            [/./, 'string'],\n        ],\n        dblStringBody: [\n            [/\\\\./, {\n                    cases: {\n                        '@special': 'string',\n                        '@default': 'error-token'\n                    }\n                }],\n            [/\"/, 'string.escape', '@popall'],\n            [/./, 'string'],\n        ]\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9ub2RlX21vZHVsZXMvbW9uYWNvLWVkaXRvci9lc20vdnMvYmFzaWMtbGFuZ3VhZ2VzL3Ivci5qcy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9tb25hY28tZWRpdG9yL2VzbS92cy9iYXNpYy1sYW5ndWFnZXMvci9yLmpzPzQzMWUiXSwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG4ndXNlIHN0cmljdCc7XG5leHBvcnQgdmFyIGNvbmYgPSB7XG4gICAgY29tbWVudHM6IHtcbiAgICAgICAgbGluZUNvbW1lbnQ6ICcjJ1xuICAgIH0sXG4gICAgYnJhY2tldHM6IFtcbiAgICAgICAgWyd7JywgJ30nXSxcbiAgICAgICAgWydbJywgJ10nXSxcbiAgICAgICAgWycoJywgJyknXVxuICAgIF0sXG4gICAgYXV0b0Nsb3NpbmdQYWlyczogW1xuICAgICAgICB7IG9wZW46ICd7JywgY2xvc2U6ICd9JyB9LFxuICAgICAgICB7IG9wZW46ICdbJywgY2xvc2U6ICddJyB9LFxuICAgICAgICB7IG9wZW46ICcoJywgY2xvc2U6ICcpJyB9LFxuICAgICAgICB7IG9wZW46ICdcIicsIGNsb3NlOiAnXCInIH0sXG4gICAgXSxcbiAgICBzdXJyb3VuZGluZ1BhaXJzOiBbXG4gICAgICAgIHsgb3BlbjogJ3snLCBjbG9zZTogJ30nIH0sXG4gICAgICAgIHsgb3BlbjogJ1snLCBjbG9zZTogJ10nIH0sXG4gICAgICAgIHsgb3BlbjogJygnLCBjbG9zZTogJyknIH0sXG4gICAgICAgIHsgb3BlbjogJ1wiJywgY2xvc2U6ICdcIicgfSxcbiAgICBdXG59O1xuZXhwb3J0IHZhciBsYW5ndWFnZSA9IHtcbiAgICBkZWZhdWx0VG9rZW46ICcnLFxuICAgIHRva2VuUG9zdGZpeDogJy5yJyxcbiAgICByb3h5Z2VuOiBbXG4gICAgICAgICdAcGFyYW0nLFxuICAgICAgICAnQHJldHVybicsXG4gICAgICAgICdAbmFtZScsXG4gICAgICAgICdAcmRuYW1lJyxcbiAgICAgICAgJ0BleGFtcGxlcycsXG4gICAgICAgICdAaW5jbHVkZScsXG4gICAgICAgICdAZG9jVHlwZScsXG4gICAgICAgICdAUzNtZXRob2QnLFxuICAgICAgICAnQFRPRE8nLFxuICAgICAgICAnQGFsaWFzZXMnLFxuICAgICAgICAnQGFsaWFzJyxcbiAgICAgICAgJ0Bhc3NpZ25lZScsXG4gICAgICAgICdAYXV0aG9yJyxcbiAgICAgICAgJ0BjYWxsR3JhcGhEZXB0aCcsXG4gICAgICAgICdAY2FsbEdyYXBoJyxcbiAgICAgICAgJ0BjYWxsR3JhcGhQcmltaXRpdmVzJyxcbiAgICAgICAgJ0Bjb25jZXB0JyxcbiAgICAgICAgJ0BleHBvcnRDbGFzcycsXG4gICAgICAgICdAZXhwb3J0TWV0aG9kJyxcbiAgICAgICAgJ0BleHBvcnRQYXR0ZXJuJyxcbiAgICAgICAgJ0BleHBvcnQnLFxuICAgICAgICAnQGZvcm1hbHMnLFxuICAgICAgICAnQGZvcm1hdCcsXG4gICAgICAgICdAaW1wb3J0Q2xhc3Nlc0Zyb20nLFxuICAgICAgICAnQGltcG9ydEZyb20nLFxuICAgICAgICAnQGltcG9ydE1ldGhvZHNGcm9tJyxcbiAgICAgICAgJ0BpbXBvcnQnLFxuICAgICAgICAnQGtleXdvcmRzJyxcbiAgICAgICAgJ0BtZXRob2QnLFxuICAgICAgICAnQG5vcmQnLFxuICAgICAgICAnQG5vdGUnLFxuICAgICAgICAnQHJlZmVyZW5jZXMnLFxuICAgICAgICAnQHNlZWFsc28nLFxuICAgICAgICAnQHNldENsYXNzJyxcbiAgICAgICAgJ0BzbG90JyxcbiAgICAgICAgJ0Bzb3VyY2UnLFxuICAgICAgICAnQHRpdGxlJyxcbiAgICAgICAgJ0B1c2FnZSdcbiAgICBdLFxuICAgIGNvbnN0YW50czogW1xuICAgICAgICAnTlVMTCcsXG4gICAgICAgICdGQUxTRScsXG4gICAgICAgICdUUlVFJyxcbiAgICAgICAgJ05BJyxcbiAgICAgICAgJ0luZicsXG4gICAgICAgICdOYU4gJyxcbiAgICAgICAgJ05BX2ludGVnZXJfJyxcbiAgICAgICAgJ05BX3JlYWxfJyxcbiAgICAgICAgJ05BX2NvbXBsZXhfJyxcbiAgICAgICAgJ05BX2NoYXJhY3Rlcl8gJyxcbiAgICAgICAgJ1QnLFxuICAgICAgICAnRicsXG4gICAgICAgICdMRVRURVJTJyxcbiAgICAgICAgJ2xldHRlcnMnLFxuICAgICAgICAnbW9udGguYWJiJyxcbiAgICAgICAgJ21vbnRoLm5hbWUnLFxuICAgICAgICAncGknLFxuICAgICAgICAnUi52ZXJzaW9uLnN0cmluZydcbiAgICBdLFxuICAgIGtleXdvcmRzOiBbXG4gICAgICAgICdicmVhaycsXG4gICAgICAgICduZXh0JyxcbiAgICAgICAgJ3JldHVybicsXG4gICAgICAgICdpZicsXG4gICAgICAgICdlbHNlJyxcbiAgICAgICAgJ2ZvcicsXG4gICAgICAgICdpbicsXG4gICAgICAgICdyZXBlYXQnLFxuICAgICAgICAnd2hpbGUnLFxuICAgICAgICAnYXJyYXknLFxuICAgICAgICAnY2F0ZWdvcnknLFxuICAgICAgICAnY2hhcmFjdGVyJyxcbiAgICAgICAgJ2NvbXBsZXgnLFxuICAgICAgICAnZG91YmxlJyxcbiAgICAgICAgJ2Z1bmN0aW9uJyxcbiAgICAgICAgJ2ludGVnZXInLFxuICAgICAgICAnbGlzdCcsXG4gICAgICAgICdsb2dpY2FsJyxcbiAgICAgICAgJ21hdHJpeCcsXG4gICAgICAgICdudW1lcmljJyxcbiAgICAgICAgJ3ZlY3RvcicsXG4gICAgICAgICdkYXRhLmZyYW1lJyxcbiAgICAgICAgJ2ZhY3RvcicsXG4gICAgICAgICdsaWJyYXJ5JyxcbiAgICAgICAgJ3JlcXVpcmUnLFxuICAgICAgICAnYXR0YWNoJyxcbiAgICAgICAgJ2RldGFjaCcsXG4gICAgICAgICdzb3VyY2UnXG4gICAgXSxcbiAgICBzcGVjaWFsOiBbXG4gICAgICAgICdcXFxcbicsXG4gICAgICAgICdcXFxccicsXG4gICAgICAgICdcXFxcdCcsXG4gICAgICAgICdcXFxcYicsXG4gICAgICAgICdcXFxcYScsXG4gICAgICAgICdcXFxcZicsXG4gICAgICAgICdcXFxcdicsXG4gICAgICAgICdcXFxcXFwnJyxcbiAgICAgICAgJ1xcXFxcIicsXG4gICAgICAgICdcXFxcXFxcXCdcbiAgICBdLFxuICAgIGJyYWNrZXRzOiBbXG4gICAgICAgIHsgb3BlbjogJ3snLCBjbG9zZTogJ30nLCB0b2tlbjogJ2RlbGltaXRlci5jdXJseScgfSxcbiAgICAgICAgeyBvcGVuOiAnWycsIGNsb3NlOiAnXScsIHRva2VuOiAnZGVsaW1pdGVyLmJyYWNrZXQnIH0sXG4gICAgICAgIHsgb3BlbjogJygnLCBjbG9zZTogJyknLCB0b2tlbjogJ2RlbGltaXRlci5wYXJlbnRoZXNpcycgfVxuICAgIF0sXG4gICAgdG9rZW5pemVyOiB7XG4gICAgICAgIHJvb3Q6IFtcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ0BudW1iZXJzJyB9LFxuICAgICAgICAgICAgeyBpbmNsdWRlOiAnQHN0cmluZ3MnIH0sXG4gICAgICAgICAgICBbL1t7fVxcW1xcXSgpXS8sICdAYnJhY2tldHMnXSxcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ0BvcGVyYXRvcnMnIH0sXG4gICAgICAgICAgICBbLyMnLywgJ2NvbW1lbnQuZG9jJywgJ0Byb3h5Z2VuJ10sXG4gICAgICAgICAgICBbLyheIy4qJCkvLCAnY29tbWVudCddLFxuICAgICAgICAgICAgWy9cXHMrLywgJ3doaXRlJ10sXG4gICAgICAgICAgICBbL1ssOjtdLywgJ2RlbGltaXRlciddLFxuICAgICAgICAgICAgWy9AW2EtekEtWl1cXHcqLywgJ3RhZyddLFxuICAgICAgICAgICAgWy9bYS16QS1aXVxcdyovLCB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnQGtleXdvcmRzJzogJ2tleXdvcmQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0Bjb25zdGFudHMnOiAnY29uc3RhbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BkZWZhdWx0JzogJ2lkZW50aWZpZXInXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICBdLFxuICAgICAgICAvLyBSZWNvZ25pemUgUm94eWdlbiBjb21tZW50c1xuICAgICAgICByb3h5Z2VuOiBbXG4gICAgICAgICAgICBbL0BcXHcrLywge1xuICAgICAgICAgICAgICAgICAgICBjYXNlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0Byb3h5Z2VuJzogJ3RhZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGVvcyc6IHsgdG9rZW46ICdjb21tZW50LmRvYycsIG5leHQ6ICdAcG9wJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BkZWZhdWx0JzogJ2NvbW1lbnQuZG9jJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBbL1xccysvLCB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnQGVvcyc6IHsgdG9rZW46ICdjb21tZW50LmRvYycsIG5leHQ6ICdAcG9wJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BkZWZhdWx0JzogJ2NvbW1lbnQuZG9jJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBbLy4qLywgeyB0b2tlbjogJ2NvbW1lbnQuZG9jJywgbmV4dDogJ0Bwb3AnIH1dXG4gICAgICAgIF0sXG4gICAgICAgIC8vIFJlY29nbml6ZSBwb3NpdGl2ZXMsIG5lZ2F0aXZlcywgZGVjaW1hbHMsIGltYWdpbmFyaWVzLCBhbmQgc2NpZW50aWZpYyBub3RhdGlvblxuICAgICAgICBudW1iZXJzOiBbXG4gICAgICAgICAgICBbLzBbeFhdWzAtOWEtZkEtRl0rLywgJ251bWJlci5oZXgnXSxcbiAgICAgICAgICAgIFsvLT8oXFxkKlxcLik/XFxkKyhbZUVdWytcXC1dP1xcZCspPy8sICdudW1iZXInXVxuICAgICAgICBdLFxuICAgICAgICAvLyBSZWNvZ25pemUgb3BlcmF0b3JzXG4gICAgICAgIG9wZXJhdG9yczogW1xuICAgICAgICAgICAgWy88ezEsMn0tLywgJ29wZXJhdG9yJ10sXG4gICAgICAgICAgICBbLy0+ezEsMn0vLCAnb3BlcmF0b3InXSxcbiAgICAgICAgICAgIFsvJVteJVxcc10rJS8sICdvcGVyYXRvciddLFxuICAgICAgICAgICAgWy9cXCpcXCovLCAnb3BlcmF0b3InXSxcbiAgICAgICAgICAgIFsvJSUvLCAnb3BlcmF0b3InXSxcbiAgICAgICAgICAgIFsvJiYvLCAnb3BlcmF0b3InXSxcbiAgICAgICAgICAgIFsvXFx8XFx8LywgJ29wZXJhdG9yJ10sXG4gICAgICAgICAgICBbLzw8LywgJ29wZXJhdG9yJ10sXG4gICAgICAgICAgICBbLz4+LywgJ29wZXJhdG9yJ10sXG4gICAgICAgICAgICBbL1stKz0mfCE8Pl5+Ki86JF0vLCAnb3BlcmF0b3InXVxuICAgICAgICBdLFxuICAgICAgICAvLyBSZWNvZ25pemUgc3RyaW5ncywgaW5jbHVkaW5nIHRob3NlIGJyb2tlbiBhY3Jvc3MgbGluZXNcbiAgICAgICAgc3RyaW5nczogW1xuICAgICAgICAgICAgWy8nLywgJ3N0cmluZy5lc2NhcGUnLCAnQHN0cmluZ0JvZHknXSxcbiAgICAgICAgICAgIFsvXCIvLCAnc3RyaW5nLmVzY2FwZScsICdAZGJsU3RyaW5nQm9keSddXG4gICAgICAgIF0sXG4gICAgICAgIHN0cmluZ0JvZHk6IFtcbiAgICAgICAgICAgIFsvXFxcXC4vLCB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnQHNwZWNpYWwnOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdAZGVmYXVsdCc6ICdlcnJvci10b2tlbidcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgWy8nLywgJ3N0cmluZy5lc2NhcGUnLCAnQHBvcGFsbCddLFxuICAgICAgICAgICAgWy8uLywgJ3N0cmluZyddLFxuICAgICAgICBdLFxuICAgICAgICBkYmxTdHJpbmdCb2R5OiBbXG4gICAgICAgICAgICBbL1xcXFwuLywge1xuICAgICAgICAgICAgICAgICAgICBjYXNlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0BzcGVjaWFsJzogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGRlZmF1bHQnOiAnZXJyb3ItdG9rZW4nXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFsvXCIvLCAnc3RyaW5nLmVzY2FwZScsICdAcG9wYWxsJ10sXG4gICAgICAgICAgICBbLy4vLCAnc3RyaW5nJ10sXG4gICAgICAgIF1cbiAgICB9XG59O1xuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOyIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./node_modules/monaco-editor/esm/vs/basic-languages/r/r.js\n");

/***/ })

}]);