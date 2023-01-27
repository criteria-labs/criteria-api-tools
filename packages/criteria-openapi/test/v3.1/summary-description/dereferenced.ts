const openAPI: any = {
  openapi: '3.0.3',
  info: {
    title: 'Test API',
    version: '1.0.0'
  },
  paths: {
    '/people': {
      summary: 'People endpoint',
      description: 'A specialized description that overrides the shared one.',
      parameters: [null]
    },
    '/pets': {
      summary: 'Generic endpoint',
      description: 'A shared description.',
      parameters: [null]
    }
  },
  components: {
    pathItems: {
      endpoint: {
        summary: 'Generic endpoint',
        description: 'A shared description.',
        parameters: [
          {
            name: 'debug',
            in: 'query'
          }
        ]
      }
    }
  }
}

openAPI.paths['/people'].parameters[0] = openAPI.components.pathItems['endpoint'].parameters[0]
openAPI.paths['/pets'].parameters[0] = openAPI.components.pathItems['endpoint'].parameters[0]

export default openAPI
