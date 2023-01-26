export default {
  openapi: '3.0.3',
  info: {
    title: 'Test API',
    version: '1.0.0'
  },
  paths: {},
  components: {
    schemas: {
      thing: {
        title: 'thing',
        description:
          "This JSON Reference has additional properties (other than $ref). Normally, this creates a new type that extends the referenced type, but since this reference points to ITSELF, it doesn't do that.\n"
      }
    }
  }
}
