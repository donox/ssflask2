(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[27],{

/***/ "./node_modules/monaco-editor/esm/vs/basic-languages/mips/mips.js":
/*!************************************************************************!*\
  !*** ./node_modules/monaco-editor/esm/vs/basic-languages/mips/mips.js ***!
  \************************************************************************/
/*! exports provided: conf, language */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"conf\", function() { return conf; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"language\", function() { return language; });\n/*---------------------------------------------------------------------------------------------\n *  Copyright (c) Microsoft Corporation. All rights reserved.\n *  Licensed under the MIT License. See License.txt in the project root for license information.\n *--------------------------------------------------------------------------------------------*/\n\nvar conf = {\n    wordPattern: /(-?\\d*\\.\\d\\w*)|([^\\`\\~\\!\\@\\#%\\^\\&\\*\\(\\)\\=\\$\\-\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\?\\s]+)/g,\n    comments: {\n        blockComment: ['###', '###'],\n        lineComment: '#'\n    },\n    folding: {\n        markers: {\n            start: new RegExp(\"^\\\\s*#region\\\\b\"),\n            end: new RegExp(\"^\\\\s*#endregion\\\\b\")\n        }\n    }\n};\nvar language = {\n    defaultToken: '',\n    ignoreCase: false,\n    tokenPostfix: '.mips',\n    regEx: /\\/(?!\\/\\/)(?:[^\\/\\\\]|\\\\.)*\\/[igm]*/,\n    keywords: [\n        '.data', '.text', 'syscall', 'trap',\n        'add', 'addu', 'addi', 'addiu', 'and', 'andi',\n        'div', 'divu', 'mult', 'multu', 'nor', 'or', 'ori',\n        'sll', 'slv', 'sra', 'srav', 'srl', 'srlv',\n        'sub', 'subu', 'xor', 'xori', 'lhi', 'lho',\n        'lhi', 'llo', 'slt', 'slti', 'sltu', 'sltiu',\n        'beq', 'bgtz', 'blez', 'bne', 'j', 'jal', 'jalr', 'jr',\n        'lb', 'lbu', 'lh', 'lhu', 'lw', 'li', 'la',\n        'sb', 'sh', 'sw', 'mfhi', 'mflo', 'mthi', 'mtlo', 'move',\n    ],\n    // we include these common regular expressions\n    symbols: /[\\.,\\:]+/,\n    escapes: /\\\\(?:[abfnrtv\\\\\"'$]|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,\n    // The main tokenizer for our languages\n    tokenizer: {\n        root: [\n            // identifiers and keywords\n            [/\\$[a-zA-Z_]\\w*/, 'variable.predefined'],\n            [/[.a-zA-Z_]\\w*/, {\n                    cases: {\n                        'this': 'variable.predefined',\n                        '@keywords': { token: 'keyword.$0' },\n                        '@default': ''\n                    }\n                }],\n            // whitespace\n            [/[ \\t\\r\\n]+/, ''],\n            // Comments\n            [/#.*$/, 'comment'],\n            // regular expressions\n            ['///', { token: 'regexp', next: '@hereregexp' }],\n            [/^(\\s*)(@regEx)/, ['', 'regexp']],\n            [/(\\,)(\\s*)(@regEx)/, ['delimiter', '', 'regexp']],\n            [/(\\:)(\\s*)(@regEx)/, ['delimiter', '', 'regexp']],\n            // delimiters\n            [/@symbols/, 'delimiter'],\n            // numbers\n            [/\\d+[eE]([\\-+]?\\d+)?/, 'number.float'],\n            [/\\d+\\.\\d+([eE][\\-+]?\\d+)?/, 'number.float'],\n            [/0[xX][0-9a-fA-F]+/, 'number.hex'],\n            [/0[0-7]+(?!\\d)/, 'number.octal'],\n            [/\\d+/, 'number'],\n            // delimiter: after number because of .\\d floats\n            [/[,.]/, 'delimiter'],\n            // strings:\n            [/\"\"\"/, 'string', '@herestring.\"\"\"'],\n            [/'''/, 'string', '@herestring.\\'\\'\\''],\n            [/\"/, {\n                    cases: {\n                        '@eos': 'string',\n                        '@default': { token: 'string', next: '@string.\"' }\n                    }\n                }],\n            [/'/, {\n                    cases: {\n                        '@eos': 'string',\n                        '@default': { token: 'string', next: '@string.\\'' }\n                    }\n                }],\n        ],\n        string: [\n            [/[^\"'\\#\\\\]+/, 'string'],\n            [/@escapes/, 'string.escape'],\n            [/\\./, 'string.escape.invalid'],\n            [/\\./, 'string.escape.invalid'],\n            [/#{/, {\n                    cases: {\n                        '$S2==\"': { token: 'string', next: 'root.interpolatedstring' },\n                        '@default': 'string'\n                    }\n                }],\n            [/[\"']/, {\n                    cases: {\n                        '$#==$S2': { token: 'string', next: '@pop' },\n                        '@default': 'string'\n                    }\n                }],\n            [/#/, 'string']\n        ],\n        herestring: [\n            [/(\"\"\"|''')/, {\n                    cases: {\n                        '$1==$S2': { token: 'string', next: '@pop' },\n                        '@default': 'string'\n                    }\n                }],\n            [/[^#\\\\'\"]+/, 'string'],\n            [/['\"]+/, 'string'],\n            [/@escapes/, 'string.escape'],\n            [/\\./, 'string.escape.invalid'],\n            [/#{/, { token: 'string.quote', next: 'root.interpolatedstring' }],\n            [/#/, 'string']\n        ],\n        comment: [\n            [/[^#]+/, 'comment',],\n            [/#/, 'comment'],\n        ],\n        hereregexp: [\n            [/[^\\\\\\/#]+/, 'regexp'],\n            [/\\\\./, 'regexp'],\n            [/#.*$/, 'comment'],\n            ['///[igm]*', { token: 'regexp', next: '@pop' }],\n            [/\\//, 'regexp'],\n        ],\n    },\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9ub2RlX21vZHVsZXMvbW9uYWNvLWVkaXRvci9lc20vdnMvYmFzaWMtbGFuZ3VhZ2VzL21pcHMvbWlwcy5qcy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9tb25hY28tZWRpdG9yL2VzbS92cy9iYXNpYy1sYW5ndWFnZXMvbWlwcy9taXBzLmpzPzBkMzUiXSwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG4ndXNlIHN0cmljdCc7XG5leHBvcnQgdmFyIGNvbmYgPSB7XG4gICAgd29yZFBhdHRlcm46IC8oLT9cXGQqXFwuXFxkXFx3Kil8KFteXFxgXFx+XFwhXFxAXFwjJVxcXlxcJlxcKlxcKFxcKVxcPVxcJFxcLVxcK1xcW1xce1xcXVxcfVxcXFxcXHxcXDtcXDpcXCdcXFwiXFwsXFwuXFw8XFw+XFwvXFw/XFxzXSspL2csXG4gICAgY29tbWVudHM6IHtcbiAgICAgICAgYmxvY2tDb21tZW50OiBbJyMjIycsICcjIyMnXSxcbiAgICAgICAgbGluZUNvbW1lbnQ6ICcjJ1xuICAgIH0sXG4gICAgZm9sZGluZzoge1xuICAgICAgICBtYXJrZXJzOiB7XG4gICAgICAgICAgICBzdGFydDogbmV3IFJlZ0V4cChcIl5cXFxccyojcmVnaW9uXFxcXGJcIiksXG4gICAgICAgICAgICBlbmQ6IG5ldyBSZWdFeHAoXCJeXFxcXHMqI2VuZHJlZ2lvblxcXFxiXCIpXG4gICAgICAgIH1cbiAgICB9XG59O1xuZXhwb3J0IHZhciBsYW5ndWFnZSA9IHtcbiAgICBkZWZhdWx0VG9rZW46ICcnLFxuICAgIGlnbm9yZUNhc2U6IGZhbHNlLFxuICAgIHRva2VuUG9zdGZpeDogJy5taXBzJyxcbiAgICByZWdFeDogL1xcLyg/IVxcL1xcLykoPzpbXlxcL1xcXFxdfFxcXFwuKSpcXC9baWdtXSovLFxuICAgIGtleXdvcmRzOiBbXG4gICAgICAgICcuZGF0YScsICcudGV4dCcsICdzeXNjYWxsJywgJ3RyYXAnLFxuICAgICAgICAnYWRkJywgJ2FkZHUnLCAnYWRkaScsICdhZGRpdScsICdhbmQnLCAnYW5kaScsXG4gICAgICAgICdkaXYnLCAnZGl2dScsICdtdWx0JywgJ211bHR1JywgJ25vcicsICdvcicsICdvcmknLFxuICAgICAgICAnc2xsJywgJ3NsdicsICdzcmEnLCAnc3JhdicsICdzcmwnLCAnc3JsdicsXG4gICAgICAgICdzdWInLCAnc3VidScsICd4b3InLCAneG9yaScsICdsaGknLCAnbGhvJyxcbiAgICAgICAgJ2xoaScsICdsbG8nLCAnc2x0JywgJ3NsdGknLCAnc2x0dScsICdzbHRpdScsXG4gICAgICAgICdiZXEnLCAnYmd0eicsICdibGV6JywgJ2JuZScsICdqJywgJ2phbCcsICdqYWxyJywgJ2pyJyxcbiAgICAgICAgJ2xiJywgJ2xidScsICdsaCcsICdsaHUnLCAnbHcnLCAnbGknLCAnbGEnLFxuICAgICAgICAnc2InLCAnc2gnLCAnc3cnLCAnbWZoaScsICdtZmxvJywgJ210aGknLCAnbXRsbycsICdtb3ZlJyxcbiAgICBdLFxuICAgIC8vIHdlIGluY2x1ZGUgdGhlc2UgY29tbW9uIHJlZ3VsYXIgZXhwcmVzc2lvbnNcbiAgICBzeW1ib2xzOiAvW1xcLixcXDpdKy8sXG4gICAgZXNjYXBlczogL1xcXFwoPzpbYWJmbnJ0dlxcXFxcIickXXx4WzAtOUEtRmEtZl17MSw0fXx1WzAtOUEtRmEtZl17NH18VVswLTlBLUZhLWZdezh9KS8sXG4gICAgLy8gVGhlIG1haW4gdG9rZW5pemVyIGZvciBvdXIgbGFuZ3VhZ2VzXG4gICAgdG9rZW5pemVyOiB7XG4gICAgICAgIHJvb3Q6IFtcbiAgICAgICAgICAgIC8vIGlkZW50aWZpZXJzIGFuZCBrZXl3b3Jkc1xuICAgICAgICAgICAgWy9cXCRbYS16QS1aX11cXHcqLywgJ3ZhcmlhYmxlLnByZWRlZmluZWQnXSxcbiAgICAgICAgICAgIFsvWy5hLXpBLVpfXVxcdyovLCB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAndGhpcyc6ICd2YXJpYWJsZS5wcmVkZWZpbmVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdAa2V5d29yZHMnOiB7IHRva2VuOiAna2V5d29yZC4kMCcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdAZGVmYXVsdCc6ICcnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIC8vIHdoaXRlc3BhY2VcbiAgICAgICAgICAgIFsvWyBcXHRcXHJcXG5dKy8sICcnXSxcbiAgICAgICAgICAgIC8vIENvbW1lbnRzXG4gICAgICAgICAgICBbLyMuKiQvLCAnY29tbWVudCddLFxuICAgICAgICAgICAgLy8gcmVndWxhciBleHByZXNzaW9uc1xuICAgICAgICAgICAgWycvLy8nLCB7IHRva2VuOiAncmVnZXhwJywgbmV4dDogJ0BoZXJlcmVnZXhwJyB9XSxcbiAgICAgICAgICAgIFsvXihcXHMqKShAcmVnRXgpLywgWycnLCAncmVnZXhwJ11dLFxuICAgICAgICAgICAgWy8oXFwsKShcXHMqKShAcmVnRXgpLywgWydkZWxpbWl0ZXInLCAnJywgJ3JlZ2V4cCddXSxcbiAgICAgICAgICAgIFsvKFxcOikoXFxzKikoQHJlZ0V4KS8sIFsnZGVsaW1pdGVyJywgJycsICdyZWdleHAnXV0sXG4gICAgICAgICAgICAvLyBkZWxpbWl0ZXJzXG4gICAgICAgICAgICBbL0BzeW1ib2xzLywgJ2RlbGltaXRlciddLFxuICAgICAgICAgICAgLy8gbnVtYmVyc1xuICAgICAgICAgICAgWy9cXGQrW2VFXShbXFwtK10/XFxkKyk/LywgJ251bWJlci5mbG9hdCddLFxuICAgICAgICAgICAgWy9cXGQrXFwuXFxkKyhbZUVdW1xcLStdP1xcZCspPy8sICdudW1iZXIuZmxvYXQnXSxcbiAgICAgICAgICAgIFsvMFt4WF1bMC05YS1mQS1GXSsvLCAnbnVtYmVyLmhleCddLFxuICAgICAgICAgICAgWy8wWzAtN10rKD8hXFxkKS8sICdudW1iZXIub2N0YWwnXSxcbiAgICAgICAgICAgIFsvXFxkKy8sICdudW1iZXInXSxcbiAgICAgICAgICAgIC8vIGRlbGltaXRlcjogYWZ0ZXIgbnVtYmVyIGJlY2F1c2Ugb2YgLlxcZCBmbG9hdHNcbiAgICAgICAgICAgIFsvWywuXS8sICdkZWxpbWl0ZXInXSxcbiAgICAgICAgICAgIC8vIHN0cmluZ3M6XG4gICAgICAgICAgICBbL1wiXCJcIi8sICdzdHJpbmcnLCAnQGhlcmVzdHJpbmcuXCJcIlwiJ10sXG4gICAgICAgICAgICBbLycnJy8sICdzdHJpbmcnLCAnQGhlcmVzdHJpbmcuXFwnXFwnXFwnJ10sXG4gICAgICAgICAgICBbL1wiLywge1xuICAgICAgICAgICAgICAgICAgICBjYXNlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0Blb3MnOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdAZGVmYXVsdCc6IHsgdG9rZW46ICdzdHJpbmcnLCBuZXh0OiAnQHN0cmluZy5cIicgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBbLycvLCB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnQGVvcyc6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BkZWZhdWx0JzogeyB0b2tlbjogJ3N0cmluZycsIG5leHQ6ICdAc3RyaW5nLlxcJycgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgIF0sXG4gICAgICAgIHN0cmluZzogW1xuICAgICAgICAgICAgWy9bXlwiJ1xcI1xcXFxdKy8sICdzdHJpbmcnXSxcbiAgICAgICAgICAgIFsvQGVzY2FwZXMvLCAnc3RyaW5nLmVzY2FwZSddLFxuICAgICAgICAgICAgWy9cXC4vLCAnc3RyaW5nLmVzY2FwZS5pbnZhbGlkJ10sXG4gICAgICAgICAgICBbL1xcLi8sICdzdHJpbmcuZXNjYXBlLmludmFsaWQnXSxcbiAgICAgICAgICAgIFsvI3svLCB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnJFMyPT1cIic6IHsgdG9rZW46ICdzdHJpbmcnLCBuZXh0OiAncm9vdC5pbnRlcnBvbGF0ZWRzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGRlZmF1bHQnOiAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBbL1tcIiddLywge1xuICAgICAgICAgICAgICAgICAgICBjYXNlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJyQjPT0kUzInOiB7IHRva2VuOiAnc3RyaW5nJywgbmV4dDogJ0Bwb3AnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGRlZmF1bHQnOiAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBbLyMvLCAnc3RyaW5nJ11cbiAgICAgICAgXSxcbiAgICAgICAgaGVyZXN0cmluZzogW1xuICAgICAgICAgICAgWy8oXCJcIlwifCcnJykvLCB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnJDE9PSRTMic6IHsgdG9rZW46ICdzdHJpbmcnLCBuZXh0OiAnQHBvcCcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdAZGVmYXVsdCc6ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFsvW14jXFxcXCdcIl0rLywgJ3N0cmluZyddLFxuICAgICAgICAgICAgWy9bJ1wiXSsvLCAnc3RyaW5nJ10sXG4gICAgICAgICAgICBbL0Blc2NhcGVzLywgJ3N0cmluZy5lc2NhcGUnXSxcbiAgICAgICAgICAgIFsvXFwuLywgJ3N0cmluZy5lc2NhcGUuaW52YWxpZCddLFxuICAgICAgICAgICAgWy8jey8sIHsgdG9rZW46ICdzdHJpbmcucXVvdGUnLCBuZXh0OiAncm9vdC5pbnRlcnBvbGF0ZWRzdHJpbmcnIH1dLFxuICAgICAgICAgICAgWy8jLywgJ3N0cmluZyddXG4gICAgICAgIF0sXG4gICAgICAgIGNvbW1lbnQ6IFtcbiAgICAgICAgICAgIFsvW14jXSsvLCAnY29tbWVudCcsXSxcbiAgICAgICAgICAgIFsvIy8sICdjb21tZW50J10sXG4gICAgICAgIF0sXG4gICAgICAgIGhlcmVyZWdleHA6IFtcbiAgICAgICAgICAgIFsvW15cXFxcXFwvI10rLywgJ3JlZ2V4cCddLFxuICAgICAgICAgICAgWy9cXFxcLi8sICdyZWdleHAnXSxcbiAgICAgICAgICAgIFsvIy4qJC8sICdjb21tZW50J10sXG4gICAgICAgICAgICBbJy8vL1tpZ21dKicsIHsgdG9rZW46ICdyZWdleHAnLCBuZXh0OiAnQHBvcCcgfV0sXG4gICAgICAgICAgICBbL1xcLy8sICdyZWdleHAnXSxcbiAgICAgICAgXSxcbiAgICB9LFxufTtcbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./node_modules/monaco-editor/esm/vs/basic-languages/mips/mips.js\n");

/***/ })

}]);