(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[61],{

/***/ "./node_modules/monaco-editor/esm/vs/basic-languages/yaml/yaml.js":
/*!************************************************************************!*\
  !*** ./node_modules/monaco-editor/esm/vs/basic-languages/yaml/yaml.js ***!
  \************************************************************************/
/*! exports provided: conf, language */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"conf\", function() { return conf; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"language\", function() { return language; });\nvar conf = {\n    comments: {\n        lineComment: '#'\n    },\n    brackets: [\n        ['{', '}'],\n        ['[', ']'],\n        ['(', ')']\n    ],\n    autoClosingPairs: [\n        { open: '{', close: '}' },\n        { open: '[', close: ']' },\n        { open: '(', close: ')' },\n        { open: '\"', close: '\"' },\n        { open: '\\'', close: '\\'' },\n    ],\n    surroundingPairs: [\n        { open: '{', close: '}' },\n        { open: '[', close: ']' },\n        { open: '(', close: ')' },\n        { open: '\"', close: '\"' },\n        { open: '\\'', close: '\\'' },\n    ],\n    folding: {\n        offSide: true\n    }\n};\nvar language = {\n    tokenPostfix: '.yaml',\n    brackets: [\n        { token: 'delimiter.bracket', open: '{', close: '}' },\n        { token: 'delimiter.square', open: '[', close: ']' }\n    ],\n    keywords: ['true', 'True', 'TRUE', 'false', 'False', 'FALSE', 'null', 'Null', 'Null', '~'],\n    numberInteger: /(?:0|[+-]?[0-9]+)/,\n    numberFloat: /(?:0|[+-]?[0-9]+)(?:\\.[0-9]+)?(?:e[-+][1-9][0-9]*)?/,\n    numberOctal: /0o[0-7]+/,\n    numberHex: /0x[0-9a-fA-F]+/,\n    numberInfinity: /[+-]?\\.(?:inf|Inf|INF)/,\n    numberNaN: /\\.(?:nan|Nan|NAN)/,\n    numberDate: /\\d{4}-\\d\\d-\\d\\d([Tt ]\\d\\d:\\d\\d:\\d\\d(\\.\\d+)?(( ?[+-]\\d\\d?(:\\d\\d)?)|Z)?)?/,\n    escapes: /\\\\(?:[btnfr\\\\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,\n    tokenizer: {\n        root: [\n            { include: '@whitespace' },\n            { include: '@comment' },\n            // Directive\n            [/%[^ ]+.*$/, 'meta.directive'],\n            // Document Markers\n            [/---/, 'operators.directivesEnd'],\n            [/\\.{3}/, 'operators.documentEnd'],\n            // Block Structure Indicators\n            [/[-?:](?= )/, 'operators'],\n            { include: '@anchor' },\n            { include: '@tagHandle' },\n            { include: '@flowCollections' },\n            { include: '@blockStyle' },\n            // Numbers\n            [/@numberInteger(?![ \\t]*\\S+)/, 'number'],\n            [/@numberFloat(?![ \\t]*\\S+)/, 'number.float'],\n            [/@numberOctal(?![ \\t]*\\S+)/, 'number.octal'],\n            [/@numberHex(?![ \\t]*\\S+)/, 'number.hex'],\n            [/@numberInfinity(?![ \\t]*\\S+)/, 'number.infinity'],\n            [/@numberNaN(?![ \\t]*\\S+)/, 'number.nan'],\n            [/@numberDate(?![ \\t]*\\S+)/, 'number.date'],\n            // Key:Value pair\n            [/(\".*?\"|'.*?'|.*?)([ \\t]*)(:)( |$)/, ['type', 'white', 'operators', 'white']],\n            { include: '@flowScalars' },\n            // String nodes\n            [/.+$/, {\n                    cases: {\n                        '@keywords': 'keyword',\n                        '@default': 'string'\n                    }\n                }]\n        ],\n        // Flow Collection: Flow Mapping\n        object: [\n            { include: '@whitespace' },\n            { include: '@comment' },\n            // Flow Mapping termination\n            [/\\}/, '@brackets', '@pop'],\n            // Flow Mapping delimiter\n            [/,/, 'delimiter.comma'],\n            // Flow Mapping Key:Value delimiter\n            [/:(?= )/, 'operators'],\n            // Flow Mapping Key:Value key\n            [/(?:\".*?\"|'.*?'|[^,\\{\\[]+?)(?=: )/, 'type'],\n            // Start Flow Style\n            { include: '@flowCollections' },\n            { include: '@flowScalars' },\n            // Scalar Data types\n            { include: '@tagHandle' },\n            { include: '@anchor' },\n            { include: '@flowNumber' },\n            // Other value (keyword or string)\n            [/[^\\},]+/, {\n                    cases: {\n                        '@keywords': 'keyword',\n                        '@default': 'string'\n                    }\n                }]\n        ],\n        // Flow Collection: Flow Sequence\n        array: [\n            { include: '@whitespace' },\n            { include: '@comment' },\n            // Flow Sequence termination\n            [/\\]/, '@brackets', '@pop'],\n            // Flow Sequence delimiter\n            [/,/, 'delimiter.comma'],\n            // Start Flow Style\n            { include: '@flowCollections' },\n            { include: '@flowScalars' },\n            // Scalar Data types\n            { include: '@tagHandle' },\n            { include: '@anchor' },\n            { include: '@flowNumber' },\n            // Other value (keyword or string)\n            [/[^\\],]+/, {\n                    cases: {\n                        '@keywords': 'keyword',\n                        '@default': 'string'\n                    }\n                }]\n        ],\n        // First line of a Block Style\n        multiString: [\n            [/^( +).+$/, 'string', '@multiStringContinued.$1']\n        ],\n        // Further lines of a Block Style\n        //   Workaround for indentation detection\n        multiStringContinued: [\n            [/^( *).+$/, {\n                    cases: {\n                        '$1==$S2': 'string',\n                        '@default': { token: '@rematch', next: '@popall' }\n                    }\n                }]\n        ],\n        whitespace: [\n            [/[ \\t\\r\\n]+/, 'white']\n        ],\n        // Only line comments\n        comment: [\n            [/#.*$/, 'comment']\n        ],\n        // Start Flow Collections\n        flowCollections: [\n            [/\\[/, '@brackets', '@array'],\n            [/\\{/, '@brackets', '@object']\n        ],\n        // Start Flow Scalars (quoted strings)\n        flowScalars: [\n            [/\"([^\"\\\\]|\\\\.)*$/, 'string.invalid'],\n            [/'([^'\\\\]|\\\\.)*$/, 'string.invalid'],\n            [/'[^']*'/, 'string'],\n            [/\"/, 'string', '@doubleQuotedString']\n        ],\n        doubleQuotedString: [\n            [/[^\\\\\"]+/, 'string'],\n            [/@escapes/, 'string.escape'],\n            [/\\\\./, 'string.escape.invalid'],\n            [/\"/, 'string', '@pop']\n        ],\n        // Start Block Scalar\n        blockStyle: [\n            [/[>|][0-9]*[+-]?$/, 'operators', '@multiString']\n        ],\n        // Numbers in Flow Collections (terminate with ,]})\n        flowNumber: [\n            [/@numberInteger(?=[ \\t]*[,\\]\\}])/, 'number'],\n            [/@numberFloat(?=[ \\t]*[,\\]\\}])/, 'number.float'],\n            [/@numberOctal(?=[ \\t]*[,\\]\\}])/, 'number.octal'],\n            [/@numberHex(?=[ \\t]*[,\\]\\}])/, 'number.hex'],\n            [/@numberInfinity(?=[ \\t]*[,\\]\\}])/, 'number.infinity'],\n            [/@numberNaN(?=[ \\t]*[,\\]\\}])/, 'number.nan'],\n            [/@numberDate(?=[ \\t]*[,\\]\\}])/, 'number.date']\n        ],\n        tagHandle: [\n            [/\\![^ ]*/, 'tag']\n        ],\n        anchor: [\n            [/[&*][^ ]+/, 'namespace']\n        ]\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:ssfl/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9ub2RlX21vZHVsZXMvbW9uYWNvLWVkaXRvci9lc20vdnMvYmFzaWMtbGFuZ3VhZ2VzL3lhbWwveWFtbC5qcy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9tb25hY28tZWRpdG9yL2VzbS92cy9iYXNpYy1sYW5ndWFnZXMveWFtbC95YW1sLmpzPzExYTIiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHZhciBjb25mID0ge1xuICAgIGNvbW1lbnRzOiB7XG4gICAgICAgIGxpbmVDb21tZW50OiAnIydcbiAgICB9LFxuICAgIGJyYWNrZXRzOiBbXG4gICAgICAgIFsneycsICd9J10sXG4gICAgICAgIFsnWycsICddJ10sXG4gICAgICAgIFsnKCcsICcpJ11cbiAgICBdLFxuICAgIGF1dG9DbG9zaW5nUGFpcnM6IFtcbiAgICAgICAgeyBvcGVuOiAneycsIGNsb3NlOiAnfScgfSxcbiAgICAgICAgeyBvcGVuOiAnWycsIGNsb3NlOiAnXScgfSxcbiAgICAgICAgeyBvcGVuOiAnKCcsIGNsb3NlOiAnKScgfSxcbiAgICAgICAgeyBvcGVuOiAnXCInLCBjbG9zZTogJ1wiJyB9LFxuICAgICAgICB7IG9wZW46ICdcXCcnLCBjbG9zZTogJ1xcJycgfSxcbiAgICBdLFxuICAgIHN1cnJvdW5kaW5nUGFpcnM6IFtcbiAgICAgICAgeyBvcGVuOiAneycsIGNsb3NlOiAnfScgfSxcbiAgICAgICAgeyBvcGVuOiAnWycsIGNsb3NlOiAnXScgfSxcbiAgICAgICAgeyBvcGVuOiAnKCcsIGNsb3NlOiAnKScgfSxcbiAgICAgICAgeyBvcGVuOiAnXCInLCBjbG9zZTogJ1wiJyB9LFxuICAgICAgICB7IG9wZW46ICdcXCcnLCBjbG9zZTogJ1xcJycgfSxcbiAgICBdLFxuICAgIGZvbGRpbmc6IHtcbiAgICAgICAgb2ZmU2lkZTogdHJ1ZVxuICAgIH1cbn07XG5leHBvcnQgdmFyIGxhbmd1YWdlID0ge1xuICAgIHRva2VuUG9zdGZpeDogJy55YW1sJyxcbiAgICBicmFja2V0czogW1xuICAgICAgICB7IHRva2VuOiAnZGVsaW1pdGVyLmJyYWNrZXQnLCBvcGVuOiAneycsIGNsb3NlOiAnfScgfSxcbiAgICAgICAgeyB0b2tlbjogJ2RlbGltaXRlci5zcXVhcmUnLCBvcGVuOiAnWycsIGNsb3NlOiAnXScgfVxuICAgIF0sXG4gICAga2V5d29yZHM6IFsndHJ1ZScsICdUcnVlJywgJ1RSVUUnLCAnZmFsc2UnLCAnRmFsc2UnLCAnRkFMU0UnLCAnbnVsbCcsICdOdWxsJywgJ051bGwnLCAnfiddLFxuICAgIG51bWJlckludGVnZXI6IC8oPzowfFsrLV0/WzAtOV0rKS8sXG4gICAgbnVtYmVyRmxvYXQ6IC8oPzowfFsrLV0/WzAtOV0rKSg/OlxcLlswLTldKyk/KD86ZVstK11bMS05XVswLTldKik/LyxcbiAgICBudW1iZXJPY3RhbDogLzBvWzAtN10rLyxcbiAgICBudW1iZXJIZXg6IC8weFswLTlhLWZBLUZdKy8sXG4gICAgbnVtYmVySW5maW5pdHk6IC9bKy1dP1xcLig/OmluZnxJbmZ8SU5GKS8sXG4gICAgbnVtYmVyTmFOOiAvXFwuKD86bmFufE5hbnxOQU4pLyxcbiAgICBudW1iZXJEYXRlOiAvXFxkezR9LVxcZFxcZC1cXGRcXGQoW1R0IF1cXGRcXGQ6XFxkXFxkOlxcZFxcZChcXC5cXGQrKT8oKCA/WystXVxcZFxcZD8oOlxcZFxcZCk/KXxaKT8pPy8sXG4gICAgZXNjYXBlczogL1xcXFwoPzpbYnRuZnJcXFxcXCInXXxbMC03XVswLTddP3xbMC0zXVswLTddezJ9KS8sXG4gICAgdG9rZW5pemVyOiB7XG4gICAgICAgIHJvb3Q6IFtcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ0B3aGl0ZXNwYWNlJyB9LFxuICAgICAgICAgICAgeyBpbmNsdWRlOiAnQGNvbW1lbnQnIH0sXG4gICAgICAgICAgICAvLyBEaXJlY3RpdmVcbiAgICAgICAgICAgIFsvJVteIF0rLiokLywgJ21ldGEuZGlyZWN0aXZlJ10sXG4gICAgICAgICAgICAvLyBEb2N1bWVudCBNYXJrZXJzXG4gICAgICAgICAgICBbLy0tLS8sICdvcGVyYXRvcnMuZGlyZWN0aXZlc0VuZCddLFxuICAgICAgICAgICAgWy9cXC57M30vLCAnb3BlcmF0b3JzLmRvY3VtZW50RW5kJ10sXG4gICAgICAgICAgICAvLyBCbG9jayBTdHJ1Y3R1cmUgSW5kaWNhdG9yc1xuICAgICAgICAgICAgWy9bLT86XSg/PSApLywgJ29wZXJhdG9ycyddLFxuICAgICAgICAgICAgeyBpbmNsdWRlOiAnQGFuY2hvcicgfSxcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ0B0YWdIYW5kbGUnIH0sXG4gICAgICAgICAgICB7IGluY2x1ZGU6ICdAZmxvd0NvbGxlY3Rpb25zJyB9LFxuICAgICAgICAgICAgeyBpbmNsdWRlOiAnQGJsb2NrU3R5bGUnIH0sXG4gICAgICAgICAgICAvLyBOdW1iZXJzXG4gICAgICAgICAgICBbL0BudW1iZXJJbnRlZ2VyKD8hWyBcXHRdKlxcUyspLywgJ251bWJlciddLFxuICAgICAgICAgICAgWy9AbnVtYmVyRmxvYXQoPyFbIFxcdF0qXFxTKykvLCAnbnVtYmVyLmZsb2F0J10sXG4gICAgICAgICAgICBbL0BudW1iZXJPY3RhbCg/IVsgXFx0XSpcXFMrKS8sICdudW1iZXIub2N0YWwnXSxcbiAgICAgICAgICAgIFsvQG51bWJlckhleCg/IVsgXFx0XSpcXFMrKS8sICdudW1iZXIuaGV4J10sXG4gICAgICAgICAgICBbL0BudW1iZXJJbmZpbml0eSg/IVsgXFx0XSpcXFMrKS8sICdudW1iZXIuaW5maW5pdHknXSxcbiAgICAgICAgICAgIFsvQG51bWJlck5hTig/IVsgXFx0XSpcXFMrKS8sICdudW1iZXIubmFuJ10sXG4gICAgICAgICAgICBbL0BudW1iZXJEYXRlKD8hWyBcXHRdKlxcUyspLywgJ251bWJlci5kYXRlJ10sXG4gICAgICAgICAgICAvLyBLZXk6VmFsdWUgcGFpclxuICAgICAgICAgICAgWy8oXCIuKj9cInwnLio/J3wuKj8pKFsgXFx0XSopKDopKCB8JCkvLCBbJ3R5cGUnLCAnd2hpdGUnLCAnb3BlcmF0b3JzJywgJ3doaXRlJ11dLFxuICAgICAgICAgICAgeyBpbmNsdWRlOiAnQGZsb3dTY2FsYXJzJyB9LFxuICAgICAgICAgICAgLy8gU3RyaW5nIG5vZGVzXG4gICAgICAgICAgICBbLy4rJC8sIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdAa2V5d29yZHMnOiAna2V5d29yZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGRlZmF1bHQnOiAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgXSxcbiAgICAgICAgLy8gRmxvdyBDb2xsZWN0aW9uOiBGbG93IE1hcHBpbmdcbiAgICAgICAgb2JqZWN0OiBbXG4gICAgICAgICAgICB7IGluY2x1ZGU6ICdAd2hpdGVzcGFjZScgfSxcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ0Bjb21tZW50JyB9LFxuICAgICAgICAgICAgLy8gRmxvdyBNYXBwaW5nIHRlcm1pbmF0aW9uXG4gICAgICAgICAgICBbL1xcfS8sICdAYnJhY2tldHMnLCAnQHBvcCddLFxuICAgICAgICAgICAgLy8gRmxvdyBNYXBwaW5nIGRlbGltaXRlclxuICAgICAgICAgICAgWy8sLywgJ2RlbGltaXRlci5jb21tYSddLFxuICAgICAgICAgICAgLy8gRmxvdyBNYXBwaW5nIEtleTpWYWx1ZSBkZWxpbWl0ZXJcbiAgICAgICAgICAgIFsvOig/PSApLywgJ29wZXJhdG9ycyddLFxuICAgICAgICAgICAgLy8gRmxvdyBNYXBwaW5nIEtleTpWYWx1ZSBrZXlcbiAgICAgICAgICAgIFsvKD86XCIuKj9cInwnLio/J3xbXixcXHtcXFtdKz8pKD89OiApLywgJ3R5cGUnXSxcbiAgICAgICAgICAgIC8vIFN0YXJ0IEZsb3cgU3R5bGVcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ0BmbG93Q29sbGVjdGlvbnMnIH0sXG4gICAgICAgICAgICB7IGluY2x1ZGU6ICdAZmxvd1NjYWxhcnMnIH0sXG4gICAgICAgICAgICAvLyBTY2FsYXIgRGF0YSB0eXBlc1xuICAgICAgICAgICAgeyBpbmNsdWRlOiAnQHRhZ0hhbmRsZScgfSxcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ0BhbmNob3InIH0sXG4gICAgICAgICAgICB7IGluY2x1ZGU6ICdAZmxvd051bWJlcicgfSxcbiAgICAgICAgICAgIC8vIE90aGVyIHZhbHVlIChrZXl3b3JkIG9yIHN0cmluZylcbiAgICAgICAgICAgIFsvW15cXH0sXSsvLCB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnQGtleXdvcmRzJzogJ2tleXdvcmQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BkZWZhdWx0JzogJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIF0sXG4gICAgICAgIC8vIEZsb3cgQ29sbGVjdGlvbjogRmxvdyBTZXF1ZW5jZVxuICAgICAgICBhcnJheTogW1xuICAgICAgICAgICAgeyBpbmNsdWRlOiAnQHdoaXRlc3BhY2UnIH0sXG4gICAgICAgICAgICB7IGluY2x1ZGU6ICdAY29tbWVudCcgfSxcbiAgICAgICAgICAgIC8vIEZsb3cgU2VxdWVuY2UgdGVybWluYXRpb25cbiAgICAgICAgICAgIFsvXFxdLywgJ0BicmFja2V0cycsICdAcG9wJ10sXG4gICAgICAgICAgICAvLyBGbG93IFNlcXVlbmNlIGRlbGltaXRlclxuICAgICAgICAgICAgWy8sLywgJ2RlbGltaXRlci5jb21tYSddLFxuICAgICAgICAgICAgLy8gU3RhcnQgRmxvdyBTdHlsZVxuICAgICAgICAgICAgeyBpbmNsdWRlOiAnQGZsb3dDb2xsZWN0aW9ucycgfSxcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ0BmbG93U2NhbGFycycgfSxcbiAgICAgICAgICAgIC8vIFNjYWxhciBEYXRhIHR5cGVzXG4gICAgICAgICAgICB7IGluY2x1ZGU6ICdAdGFnSGFuZGxlJyB9LFxuICAgICAgICAgICAgeyBpbmNsdWRlOiAnQGFuY2hvcicgfSxcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ0BmbG93TnVtYmVyJyB9LFxuICAgICAgICAgICAgLy8gT3RoZXIgdmFsdWUgKGtleXdvcmQgb3Igc3RyaW5nKVxuICAgICAgICAgICAgWy9bXlxcXSxdKy8sIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdAa2V5d29yZHMnOiAna2V5d29yZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGRlZmF1bHQnOiAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgXSxcbiAgICAgICAgLy8gRmlyc3QgbGluZSBvZiBhIEJsb2NrIFN0eWxlXG4gICAgICAgIG11bHRpU3RyaW5nOiBbXG4gICAgICAgICAgICBbL14oICspLiskLywgJ3N0cmluZycsICdAbXVsdGlTdHJpbmdDb250aW51ZWQuJDEnXVxuICAgICAgICBdLFxuICAgICAgICAvLyBGdXJ0aGVyIGxpbmVzIG9mIGEgQmxvY2sgU3R5bGVcbiAgICAgICAgLy8gICBXb3JrYXJvdW5kIGZvciBpbmRlbnRhdGlvbiBkZXRlY3Rpb25cbiAgICAgICAgbXVsdGlTdHJpbmdDb250aW51ZWQ6IFtcbiAgICAgICAgICAgIFsvXiggKikuKyQvLCB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnJDE9PSRTMic6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BkZWZhdWx0JzogeyB0b2tlbjogJ0ByZW1hdGNoJywgbmV4dDogJ0Bwb3BhbGwnIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIF0sXG4gICAgICAgIHdoaXRlc3BhY2U6IFtcbiAgICAgICAgICAgIFsvWyBcXHRcXHJcXG5dKy8sICd3aGl0ZSddXG4gICAgICAgIF0sXG4gICAgICAgIC8vIE9ubHkgbGluZSBjb21tZW50c1xuICAgICAgICBjb21tZW50OiBbXG4gICAgICAgICAgICBbLyMuKiQvLCAnY29tbWVudCddXG4gICAgICAgIF0sXG4gICAgICAgIC8vIFN0YXJ0IEZsb3cgQ29sbGVjdGlvbnNcbiAgICAgICAgZmxvd0NvbGxlY3Rpb25zOiBbXG4gICAgICAgICAgICBbL1xcWy8sICdAYnJhY2tldHMnLCAnQGFycmF5J10sXG4gICAgICAgICAgICBbL1xcey8sICdAYnJhY2tldHMnLCAnQG9iamVjdCddXG4gICAgICAgIF0sXG4gICAgICAgIC8vIFN0YXJ0IEZsb3cgU2NhbGFycyAocXVvdGVkIHN0cmluZ3MpXG4gICAgICAgIGZsb3dTY2FsYXJzOiBbXG4gICAgICAgICAgICBbL1wiKFteXCJcXFxcXXxcXFxcLikqJC8sICdzdHJpbmcuaW52YWxpZCddLFxuICAgICAgICAgICAgWy8nKFteJ1xcXFxdfFxcXFwuKSokLywgJ3N0cmluZy5pbnZhbGlkJ10sXG4gICAgICAgICAgICBbLydbXiddKicvLCAnc3RyaW5nJ10sXG4gICAgICAgICAgICBbL1wiLywgJ3N0cmluZycsICdAZG91YmxlUXVvdGVkU3RyaW5nJ11cbiAgICAgICAgXSxcbiAgICAgICAgZG91YmxlUXVvdGVkU3RyaW5nOiBbXG4gICAgICAgICAgICBbL1teXFxcXFwiXSsvLCAnc3RyaW5nJ10sXG4gICAgICAgICAgICBbL0Blc2NhcGVzLywgJ3N0cmluZy5lc2NhcGUnXSxcbiAgICAgICAgICAgIFsvXFxcXC4vLCAnc3RyaW5nLmVzY2FwZS5pbnZhbGlkJ10sXG4gICAgICAgICAgICBbL1wiLywgJ3N0cmluZycsICdAcG9wJ11cbiAgICAgICAgXSxcbiAgICAgICAgLy8gU3RhcnQgQmxvY2sgU2NhbGFyXG4gICAgICAgIGJsb2NrU3R5bGU6IFtcbiAgICAgICAgICAgIFsvWz58XVswLTldKlsrLV0/JC8sICdvcGVyYXRvcnMnLCAnQG11bHRpU3RyaW5nJ11cbiAgICAgICAgXSxcbiAgICAgICAgLy8gTnVtYmVycyBpbiBGbG93IENvbGxlY3Rpb25zICh0ZXJtaW5hdGUgd2l0aCAsXX0pXG4gICAgICAgIGZsb3dOdW1iZXI6IFtcbiAgICAgICAgICAgIFsvQG51bWJlckludGVnZXIoPz1bIFxcdF0qWyxcXF1cXH1dKS8sICdudW1iZXInXSxcbiAgICAgICAgICAgIFsvQG51bWJlckZsb2F0KD89WyBcXHRdKlssXFxdXFx9XSkvLCAnbnVtYmVyLmZsb2F0J10sXG4gICAgICAgICAgICBbL0BudW1iZXJPY3RhbCg/PVsgXFx0XSpbLFxcXVxcfV0pLywgJ251bWJlci5vY3RhbCddLFxuICAgICAgICAgICAgWy9AbnVtYmVySGV4KD89WyBcXHRdKlssXFxdXFx9XSkvLCAnbnVtYmVyLmhleCddLFxuICAgICAgICAgICAgWy9AbnVtYmVySW5maW5pdHkoPz1bIFxcdF0qWyxcXF1cXH1dKS8sICdudW1iZXIuaW5maW5pdHknXSxcbiAgICAgICAgICAgIFsvQG51bWJlck5hTig/PVsgXFx0XSpbLFxcXVxcfV0pLywgJ251bWJlci5uYW4nXSxcbiAgICAgICAgICAgIFsvQG51bWJlckRhdGUoPz1bIFxcdF0qWyxcXF1cXH1dKS8sICdudW1iZXIuZGF0ZSddXG4gICAgICAgIF0sXG4gICAgICAgIHRhZ0hhbmRsZTogW1xuICAgICAgICAgICAgWy9cXCFbXiBdKi8sICd0YWcnXVxuICAgICAgICBdLFxuICAgICAgICBhbmNob3I6IFtcbiAgICAgICAgICAgIFsvWyYqXVteIF0rLywgJ25hbWVzcGFjZSddXG4gICAgICAgIF1cbiAgICB9XG59O1xuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTsiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./node_modules/monaco-editor/esm/vs/basic-languages/yaml/yaml.js\n");

/***/ })

}]);