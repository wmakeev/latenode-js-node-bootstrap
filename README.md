# @latenode/js-node-bootstrap

[![npm](https://img.shields.io/npm/v/simplex-lang.svg?cacheSeconds=1800&style=flat-square)](https://www.npmjs.com/package/@latenode/js-node-bootstrap)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/wmakeev/latenode-js-node-bootstrap/main.yml?style=flat-square)](https://github.com/wmakeev/latenode-js-node-bootstrap/actions/workflows/main.yml)
![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/wmakeev/latenode-js-node-bootstrap/main/badges/coverage.json)

> Latenode JS node extension

## Table of contents <!-- omit in toc -->

- [@latenode/js-node-bootstrap](#latenodejs-node-bootstrap)
  - [Quick start](#quick-start)

## Quick start

```ts
/** @CustomParams
{
  "obj": {
    "type": "string",
    "title": "JSON string parameter",
    "description": "**JSON**: Enter JSON string"
  }
}
*/

import { getRun } from '@latenode/js-node-bootstrap'

async function logic({execution_id, input, data, store, db}, { params, customParamsConfig }) {
  const { obj } = params

  return {
    // Parsed json parameter
    obj
  }
}

export default getRun(logic)
```

<img alt="In the process of development" src="under-construction.png"/>
