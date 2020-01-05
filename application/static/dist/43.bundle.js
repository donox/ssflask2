(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[43],{

/***/ "./node_modules/monaco-editor/esm/vs/basic-languages/redis/redis.js":
/*!**************************************************************************!*\
  !*** ./node_modules/monaco-editor/esm/vs/basic-languages/redis/redis.js ***!
  \**************************************************************************/
/*! exports provided: conf, language */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"conf\", function() { return conf; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"language\", function() { return language; });\n/*---------------------------------------------------------------------------------------------\n *  Copyright (c) Microsoft Corporation. All rights reserved.\n *  Licensed under the MIT License. See License.txt in the project root for license information.\n *--------------------------------------------------------------------------------------------*/\n\nvar conf = {\n    brackets: [\n        ['{', '}'],\n        ['[', ']'],\n        ['(', ')']\n    ],\n    autoClosingPairs: [\n        { open: '{', close: '}' },\n        { open: '[', close: ']' },\n        { open: '(', close: ')' },\n        { open: '\"', close: '\"' },\n        { open: '\\'', close: '\\'' },\n    ],\n    surroundingPairs: [\n        { open: '{', close: '}' },\n        { open: '[', close: ']' },\n        { open: '(', close: ')' },\n        { open: '\"', close: '\"' },\n        { open: '\\'', close: '\\'' },\n    ]\n};\nvar language = {\n    defaultToken: '',\n    tokenPostfix: '.redis',\n    ignoreCase: true,\n    brackets: [\n        { open: '[', close: ']', token: 'delimiter.square' },\n        { open: '(', close: ')', token: 'delimiter.parenthesis' }\n    ],\n    keywords: [\n        \"APPEND\", \"AUTH\", \"BGREWRITEAOF\", \"BGSAVE\", \"BITCOUNT\", \"BITFIELD\", \"BITOP\", \"BITPOS\", \"BLPOP\", \"BRPOP\", \"BRPOPLPUSH\",\n        \"CLIENT\", \"KILL\", \"LIST\", \"GETNAME\", \"PAUSE\", \"REPLY\", \"SETNAME\", \"CLUSTER\", \"ADDSLOTS\", \"COUNT-FAILURE-REPORTS\",\n        \"COUNTKEYSINSLOT\", \"DELSLOTS\", \"FAILOVER\", \"FORGET\", \"GETKEYSINSLOT\", \"INFO\", \"KEYSLOT\", \"MEET\", \"NODES\", \"REPLICATE\",\n        \"RESET\", \"SAVECONFIG\", \"SET-CONFIG-EPOCH\", \"SETSLOT\", \"SLAVES\", \"SLOTS\", \"COMMAND\", \"COUNT\", \"GETKEYS\", \"CONFIG\", \"GET\",\n        \"REWRITE\", \"SET\", \"RESETSTAT\", \"DBSIZE\", \"DEBUG\", \"OBJECT\", \"SEGFAULT\", \"DECR\", \"DECRBY\", \"DEL\", \"DISCARD\", \"DUMP\", \"ECHO\",\n        \"EVAL\", \"EVALSHA\", \"EXEC\", \"EXISTS\", \"EXPIRE\", \"EXPIREAT\", \"FLUSHALL\", \"FLUSHDB\", \"GEOADD\", \"GEOHASH\", \"GEOPOS\", \"GEODIST\",\n        \"GEORADIUS\", \"GEORADIUSBYMEMBER\", \"GETBIT\", \"GETRANGE\", \"GETSET\", \"HDEL\", \"HEXISTS\", \"HGET\", \"HGETALL\", \"HINCRBY\", \"HINCRBYFLOAT\",\n        \"HKEYS\", \"HLEN\", \"HMGET\", \"HMSET\", \"HSET\", \"HSETNX\", \"HSTRLEN\", \"HVALS\", \"INCR\", \"INCRBY\", \"INCRBYFLOAT\", \"KEYS\", \"LASTSAVE\",\n        \"LINDEX\", \"LINSERT\", \"LLEN\", \"LPOP\", \"LPUSH\", \"LPUSHX\", \"LRANGE\", \"LREM\", \"LSET\", \"LTRIM\", \"MGET\", \"MIGRATE\", \"MONITOR\",\n        \"MOVE\", \"MSET\", \"MSETNX\", \"MULTI\", \"PERSIST\", \"PEXPIRE\", \"PEXPIREAT\", \"PFADD\", \"PFCOUNT\", \"PFMERGE\", \"PING\", \"PSETEX\",\n        \"PSUBSCRIBE\", \"PUBSUB\", \"PTTL\", \"PUBLISH\", \"PUNSUBSCRIBE\", \"QUIT\", \"RANDOMKEY\", \"READONLY\", \"READWRITE\", \"RENAME\", \"RENAMENX\",\n        \"RESTORE\", \"ROLE\", \"RPOP\", \"RPOPLPUSH\", \"RPUSH\", \"RPUSHX\", \"SADD\", \"SAVE\", \"SCARD\", \"SCRIPT\", \"FLUSH\", \"LOAD\", \"SDIFF\",\n        \"SDIFFSTORE\", \"SELECT\", \"SETBIT\", \"SETEX\", \"SETNX\", \"SETRANGE\", \"SHUTDOWN\", \"SINTER\", \"SINTERSTORE\", \"SISMEMBER\", \"SLAVEOF\",\n        \"SLOWLOG\", \"SMEMBERS\", \"SMOVE\", \"SORT\", \"SPOP\", \"SRANDMEMBER\", \"SREM\", \"STRLEN\", \"SUBSCRIBE\", \"SUNION\", \"SUNIONSTORE\", \"SWAPDB\",\n        \"SYNC\", \"TIME\", \"TOUCH\", \"TTL\", \"TYPE\", \"UNSUBSCRIBE\", \"UNLINK\", \"UNWATCH\", \"WAIT\", \"WATCH\", \"ZADD\", \"ZCARD\", \"ZCOUNT\", \"ZINCRBY\",\n        \"ZINTERSTORE\", \"ZLEXCOUNT\", \"ZRANGE\", \"ZRANGEBYLEX\", \"ZREVRANGEBYLEX\", \"ZRANGEBYSCORE\", \"ZRANK\", \"ZREM\", \"ZREMRANGEBYLEX\",\n        \"ZREMRANGEBYRANK\", \"ZREMRANGEBYSCORE\", \"ZREVRANGE\", \"ZREVRANGEBYSCORE\", \"ZREVRANK\", \"ZSCORE\", \"ZUNIONSTORE\", \"SCAN\", \"SSCAN\",\n        \"HSCAN\", \"ZSCAN\"\n    ],\n    operators: [\n    // NOT SUPPORTED\n    ],\n    builtinFunctions: [\n    // NOT SUPPORTED\n    ],\n    builtinVariables: [\n    // NOT SUPPORTED\n    ],\n    pseudoColumns: [\n    // NOT SUPPORTED\n    ],\n    tokenizer: {\n        root: [\n            { include: '@whitespace' },\n            { include: '@pseudoColumns' },\n            { include: '@numbers' },\n            { include: '@strings' },\n            { include: '@scopes' },\n            [/[;,.]/, 'delimiter'],\n            [/[()]/, '@brackets'],\n            [/[\\w@#$]+/, {\n                    cases: {\n                        '@keywords': 'keyword',\n                        '@operators': 'operator',\n                        '@builtinVariables': 'predefined',\n                        '@builtinFunctions': 'predefined',\n                        '@default': 'identifier'\n                    }\n                }],\n            [/[<>=!%&+\\-*/|~^]/, 'operator'],\n        ],\n        whitespace: [\n            [/\\s+/, 'white']\n        ],\n        pseudoColumns: [\n            [/[$][A-Za-z_][\\w@#$]*/, {\n                    cases: {\n                        '@pseudoColumns': 'predefined',\n                        '@default': 'identifier'\n                    }\n                }],\n        ],\n        numbers: [\n            [/0[xX][0-9a-fA-F]*/, 'number'],\n            [/[$][+-]*\\d*(\\.\\d*)?/, 'number'],\n            [/((\\d+(\\.\\d*)?)|(\\.\\d+))([eE][\\-+]?\\d+)?/, 'number']\n        ],\n        strings: [\n            [/'/, { token: 'string', next: '@string' }],\n            [/\"/, { token: 'string.double', next: '@stringDouble' }]\n        ],\n        string: [\n            [/[^']+/, 'string'],\n            [/''/, 'string'],\n            [/'/, { token: 'string', next: '@pop' }],\n        ],\n        stringDouble: [\n            [/[^\"]+/, 'string.double'],\n            [/\"\"/, 'string.double'],\n            [/\"/, { token: 'string.double', next: '@pop' }]\n        ],\n        scopes: [\n        // NOT SUPPORTED\n        ]\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9ub2RlX21vZHVsZXMvbW9uYWNvLWVkaXRvci9lc20vdnMvYmFzaWMtbGFuZ3VhZ2VzL3JlZGlzL3JlZGlzLmpzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL21vbmFjby1lZGl0b3IvZXNtL3ZzL2Jhc2ljLWxhbmd1YWdlcy9yZWRpcy9yZWRpcy5qcz84ZmE1Il0sInNvdXJjZXNDb250ZW50IjpbIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuJ3VzZSBzdHJpY3QnO1xuZXhwb3J0IHZhciBjb25mID0ge1xuICAgIGJyYWNrZXRzOiBbXG4gICAgICAgIFsneycsICd9J10sXG4gICAgICAgIFsnWycsICddJ10sXG4gICAgICAgIFsnKCcsICcpJ11cbiAgICBdLFxuICAgIGF1dG9DbG9zaW5nUGFpcnM6IFtcbiAgICAgICAgeyBvcGVuOiAneycsIGNsb3NlOiAnfScgfSxcbiAgICAgICAgeyBvcGVuOiAnWycsIGNsb3NlOiAnXScgfSxcbiAgICAgICAgeyBvcGVuOiAnKCcsIGNsb3NlOiAnKScgfSxcbiAgICAgICAgeyBvcGVuOiAnXCInLCBjbG9zZTogJ1wiJyB9LFxuICAgICAgICB7IG9wZW46ICdcXCcnLCBjbG9zZTogJ1xcJycgfSxcbiAgICBdLFxuICAgIHN1cnJvdW5kaW5nUGFpcnM6IFtcbiAgICAgICAgeyBvcGVuOiAneycsIGNsb3NlOiAnfScgfSxcbiAgICAgICAgeyBvcGVuOiAnWycsIGNsb3NlOiAnXScgfSxcbiAgICAgICAgeyBvcGVuOiAnKCcsIGNsb3NlOiAnKScgfSxcbiAgICAgICAgeyBvcGVuOiAnXCInLCBjbG9zZTogJ1wiJyB9LFxuICAgICAgICB7IG9wZW46ICdcXCcnLCBjbG9zZTogJ1xcJycgfSxcbiAgICBdXG59O1xuZXhwb3J0IHZhciBsYW5ndWFnZSA9IHtcbiAgICBkZWZhdWx0VG9rZW46ICcnLFxuICAgIHRva2VuUG9zdGZpeDogJy5yZWRpcycsXG4gICAgaWdub3JlQ2FzZTogdHJ1ZSxcbiAgICBicmFja2V0czogW1xuICAgICAgICB7IG9wZW46ICdbJywgY2xvc2U6ICddJywgdG9rZW46ICdkZWxpbWl0ZXIuc3F1YXJlJyB9LFxuICAgICAgICB7IG9wZW46ICcoJywgY2xvc2U6ICcpJywgdG9rZW46ICdkZWxpbWl0ZXIucGFyZW50aGVzaXMnIH1cbiAgICBdLFxuICAgIGtleXdvcmRzOiBbXG4gICAgICAgIFwiQVBQRU5EXCIsIFwiQVVUSFwiLCBcIkJHUkVXUklURUFPRlwiLCBcIkJHU0FWRVwiLCBcIkJJVENPVU5UXCIsIFwiQklURklFTERcIiwgXCJCSVRPUFwiLCBcIkJJVFBPU1wiLCBcIkJMUE9QXCIsIFwiQlJQT1BcIiwgXCJCUlBPUExQVVNIXCIsXG4gICAgICAgIFwiQ0xJRU5UXCIsIFwiS0lMTFwiLCBcIkxJU1RcIiwgXCJHRVROQU1FXCIsIFwiUEFVU0VcIiwgXCJSRVBMWVwiLCBcIlNFVE5BTUVcIiwgXCJDTFVTVEVSXCIsIFwiQUREU0xPVFNcIiwgXCJDT1VOVC1GQUlMVVJFLVJFUE9SVFNcIixcbiAgICAgICAgXCJDT1VOVEtFWVNJTlNMT1RcIiwgXCJERUxTTE9UU1wiLCBcIkZBSUxPVkVSXCIsIFwiRk9SR0VUXCIsIFwiR0VUS0VZU0lOU0xPVFwiLCBcIklORk9cIiwgXCJLRVlTTE9UXCIsIFwiTUVFVFwiLCBcIk5PREVTXCIsIFwiUkVQTElDQVRFXCIsXG4gICAgICAgIFwiUkVTRVRcIiwgXCJTQVZFQ09ORklHXCIsIFwiU0VULUNPTkZJRy1FUE9DSFwiLCBcIlNFVFNMT1RcIiwgXCJTTEFWRVNcIiwgXCJTTE9UU1wiLCBcIkNPTU1BTkRcIiwgXCJDT1VOVFwiLCBcIkdFVEtFWVNcIiwgXCJDT05GSUdcIiwgXCJHRVRcIixcbiAgICAgICAgXCJSRVdSSVRFXCIsIFwiU0VUXCIsIFwiUkVTRVRTVEFUXCIsIFwiREJTSVpFXCIsIFwiREVCVUdcIiwgXCJPQkpFQ1RcIiwgXCJTRUdGQVVMVFwiLCBcIkRFQ1JcIiwgXCJERUNSQllcIiwgXCJERUxcIiwgXCJESVNDQVJEXCIsIFwiRFVNUFwiLCBcIkVDSE9cIixcbiAgICAgICAgXCJFVkFMXCIsIFwiRVZBTFNIQVwiLCBcIkVYRUNcIiwgXCJFWElTVFNcIiwgXCJFWFBJUkVcIiwgXCJFWFBJUkVBVFwiLCBcIkZMVVNIQUxMXCIsIFwiRkxVU0hEQlwiLCBcIkdFT0FERFwiLCBcIkdFT0hBU0hcIiwgXCJHRU9QT1NcIiwgXCJHRU9ESVNUXCIsXG4gICAgICAgIFwiR0VPUkFESVVTXCIsIFwiR0VPUkFESVVTQllNRU1CRVJcIiwgXCJHRVRCSVRcIiwgXCJHRVRSQU5HRVwiLCBcIkdFVFNFVFwiLCBcIkhERUxcIiwgXCJIRVhJU1RTXCIsIFwiSEdFVFwiLCBcIkhHRVRBTExcIiwgXCJISU5DUkJZXCIsIFwiSElOQ1JCWUZMT0FUXCIsXG4gICAgICAgIFwiSEtFWVNcIiwgXCJITEVOXCIsIFwiSE1HRVRcIiwgXCJITVNFVFwiLCBcIkhTRVRcIiwgXCJIU0VUTlhcIiwgXCJIU1RSTEVOXCIsIFwiSFZBTFNcIiwgXCJJTkNSXCIsIFwiSU5DUkJZXCIsIFwiSU5DUkJZRkxPQVRcIiwgXCJLRVlTXCIsIFwiTEFTVFNBVkVcIixcbiAgICAgICAgXCJMSU5ERVhcIiwgXCJMSU5TRVJUXCIsIFwiTExFTlwiLCBcIkxQT1BcIiwgXCJMUFVTSFwiLCBcIkxQVVNIWFwiLCBcIkxSQU5HRVwiLCBcIkxSRU1cIiwgXCJMU0VUXCIsIFwiTFRSSU1cIiwgXCJNR0VUXCIsIFwiTUlHUkFURVwiLCBcIk1PTklUT1JcIixcbiAgICAgICAgXCJNT1ZFXCIsIFwiTVNFVFwiLCBcIk1TRVROWFwiLCBcIk1VTFRJXCIsIFwiUEVSU0lTVFwiLCBcIlBFWFBJUkVcIiwgXCJQRVhQSVJFQVRcIiwgXCJQRkFERFwiLCBcIlBGQ09VTlRcIiwgXCJQRk1FUkdFXCIsIFwiUElOR1wiLCBcIlBTRVRFWFwiLFxuICAgICAgICBcIlBTVUJTQ1JJQkVcIiwgXCJQVUJTVUJcIiwgXCJQVFRMXCIsIFwiUFVCTElTSFwiLCBcIlBVTlNVQlNDUklCRVwiLCBcIlFVSVRcIiwgXCJSQU5ET01LRVlcIiwgXCJSRUFET05MWVwiLCBcIlJFQURXUklURVwiLCBcIlJFTkFNRVwiLCBcIlJFTkFNRU5YXCIsXG4gICAgICAgIFwiUkVTVE9SRVwiLCBcIlJPTEVcIiwgXCJSUE9QXCIsIFwiUlBPUExQVVNIXCIsIFwiUlBVU0hcIiwgXCJSUFVTSFhcIiwgXCJTQUREXCIsIFwiU0FWRVwiLCBcIlNDQVJEXCIsIFwiU0NSSVBUXCIsIFwiRkxVU0hcIiwgXCJMT0FEXCIsIFwiU0RJRkZcIixcbiAgICAgICAgXCJTRElGRlNUT1JFXCIsIFwiU0VMRUNUXCIsIFwiU0VUQklUXCIsIFwiU0VURVhcIiwgXCJTRVROWFwiLCBcIlNFVFJBTkdFXCIsIFwiU0hVVERPV05cIiwgXCJTSU5URVJcIiwgXCJTSU5URVJTVE9SRVwiLCBcIlNJU01FTUJFUlwiLCBcIlNMQVZFT0ZcIixcbiAgICAgICAgXCJTTE9XTE9HXCIsIFwiU01FTUJFUlNcIiwgXCJTTU9WRVwiLCBcIlNPUlRcIiwgXCJTUE9QXCIsIFwiU1JBTkRNRU1CRVJcIiwgXCJTUkVNXCIsIFwiU1RSTEVOXCIsIFwiU1VCU0NSSUJFXCIsIFwiU1VOSU9OXCIsIFwiU1VOSU9OU1RPUkVcIiwgXCJTV0FQREJcIixcbiAgICAgICAgXCJTWU5DXCIsIFwiVElNRVwiLCBcIlRPVUNIXCIsIFwiVFRMXCIsIFwiVFlQRVwiLCBcIlVOU1VCU0NSSUJFXCIsIFwiVU5MSU5LXCIsIFwiVU5XQVRDSFwiLCBcIldBSVRcIiwgXCJXQVRDSFwiLCBcIlpBRERcIiwgXCJaQ0FSRFwiLCBcIlpDT1VOVFwiLCBcIlpJTkNSQllcIixcbiAgICAgICAgXCJaSU5URVJTVE9SRVwiLCBcIlpMRVhDT1VOVFwiLCBcIlpSQU5HRVwiLCBcIlpSQU5HRUJZTEVYXCIsIFwiWlJFVlJBTkdFQllMRVhcIiwgXCJaUkFOR0VCWVNDT1JFXCIsIFwiWlJBTktcIiwgXCJaUkVNXCIsIFwiWlJFTVJBTkdFQllMRVhcIixcbiAgICAgICAgXCJaUkVNUkFOR0VCWVJBTktcIiwgXCJaUkVNUkFOR0VCWVNDT1JFXCIsIFwiWlJFVlJBTkdFXCIsIFwiWlJFVlJBTkdFQllTQ09SRVwiLCBcIlpSRVZSQU5LXCIsIFwiWlNDT1JFXCIsIFwiWlVOSU9OU1RPUkVcIiwgXCJTQ0FOXCIsIFwiU1NDQU5cIixcbiAgICAgICAgXCJIU0NBTlwiLCBcIlpTQ0FOXCJcbiAgICBdLFxuICAgIG9wZXJhdG9yczogW1xuICAgIC8vIE5PVCBTVVBQT1JURURcbiAgICBdLFxuICAgIGJ1aWx0aW5GdW5jdGlvbnM6IFtcbiAgICAvLyBOT1QgU1VQUE9SVEVEXG4gICAgXSxcbiAgICBidWlsdGluVmFyaWFibGVzOiBbXG4gICAgLy8gTk9UIFNVUFBPUlRFRFxuICAgIF0sXG4gICAgcHNldWRvQ29sdW1uczogW1xuICAgIC8vIE5PVCBTVVBQT1JURURcbiAgICBdLFxuICAgIHRva2VuaXplcjoge1xuICAgICAgICByb290OiBbXG4gICAgICAgICAgICB7IGluY2x1ZGU6ICdAd2hpdGVzcGFjZScgfSxcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ0Bwc2V1ZG9Db2x1bW5zJyB9LFxuICAgICAgICAgICAgeyBpbmNsdWRlOiAnQG51bWJlcnMnIH0sXG4gICAgICAgICAgICB7IGluY2x1ZGU6ICdAc3RyaW5ncycgfSxcbiAgICAgICAgICAgIHsgaW5jbHVkZTogJ0BzY29wZXMnIH0sXG4gICAgICAgICAgICBbL1s7LC5dLywgJ2RlbGltaXRlciddLFxuICAgICAgICAgICAgWy9bKCldLywgJ0BicmFja2V0cyddLFxuICAgICAgICAgICAgWy9bXFx3QCMkXSsvLCB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnQGtleXdvcmRzJzogJ2tleXdvcmQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BvcGVyYXRvcnMnOiAnb3BlcmF0b3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BidWlsdGluVmFyaWFibGVzJzogJ3ByZWRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BidWlsdGluRnVuY3Rpb25zJzogJ3ByZWRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BkZWZhdWx0JzogJ2lkZW50aWZpZXInXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFsvWzw+PSElJitcXC0qL3x+Xl0vLCAnb3BlcmF0b3InXSxcbiAgICAgICAgXSxcbiAgICAgICAgd2hpdGVzcGFjZTogW1xuICAgICAgICAgICAgWy9cXHMrLywgJ3doaXRlJ11cbiAgICAgICAgXSxcbiAgICAgICAgcHNldWRvQ29sdW1uczogW1xuICAgICAgICAgICAgWy9bJF1bQS1aYS16X11bXFx3QCMkXSovLCB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnQHBzZXVkb0NvbHVtbnMnOiAncHJlZGVmaW5lZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGRlZmF1bHQnOiAnaWRlbnRpZmllcidcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICBdLFxuICAgICAgICBudW1iZXJzOiBbXG4gICAgICAgICAgICBbLzBbeFhdWzAtOWEtZkEtRl0qLywgJ251bWJlciddLFxuICAgICAgICAgICAgWy9bJF1bKy1dKlxcZCooXFwuXFxkKik/LywgJ251bWJlciddLFxuICAgICAgICAgICAgWy8oKFxcZCsoXFwuXFxkKik/KXwoXFwuXFxkKykpKFtlRV1bXFwtK10/XFxkKyk/LywgJ251bWJlciddXG4gICAgICAgIF0sXG4gICAgICAgIHN0cmluZ3M6IFtcbiAgICAgICAgICAgIFsvJy8sIHsgdG9rZW46ICdzdHJpbmcnLCBuZXh0OiAnQHN0cmluZycgfV0sXG4gICAgICAgICAgICBbL1wiLywgeyB0b2tlbjogJ3N0cmluZy5kb3VibGUnLCBuZXh0OiAnQHN0cmluZ0RvdWJsZScgfV1cbiAgICAgICAgXSxcbiAgICAgICAgc3RyaW5nOiBbXG4gICAgICAgICAgICBbL1teJ10rLywgJ3N0cmluZyddLFxuICAgICAgICAgICAgWy8nJy8sICdzdHJpbmcnXSxcbiAgICAgICAgICAgIFsvJy8sIHsgdG9rZW46ICdzdHJpbmcnLCBuZXh0OiAnQHBvcCcgfV0sXG4gICAgICAgIF0sXG4gICAgICAgIHN0cmluZ0RvdWJsZTogW1xuICAgICAgICAgICAgWy9bXlwiXSsvLCAnc3RyaW5nLmRvdWJsZSddLFxuICAgICAgICAgICAgWy9cIlwiLywgJ3N0cmluZy5kb3VibGUnXSxcbiAgICAgICAgICAgIFsvXCIvLCB7IHRva2VuOiAnc3RyaW5nLmRvdWJsZScsIG5leHQ6ICdAcG9wJyB9XVxuICAgICAgICBdLFxuICAgICAgICBzY29wZXM6IFtcbiAgICAgICAgLy8gTk9UIFNVUFBPUlRFRFxuICAgICAgICBdXG4gICAgfVxufTtcbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./node_modules/monaco-editor/esm/vs/basic-languages/redis/redis.js\n");

/***/ })

}]);