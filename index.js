'use strict'

const fp = require('fastify-plugin')
const { assign } = Object

function fastifyApply (fastify, options, done) {
  const hooks = [
    'onRequest',
    'preParsing',
    'preValidation',
    'preHandler',
    'preSerialization',
    'onError',
    'onSend',
    'onResponse',
    'onTimeout',
    'onReady',
    'onClose',
    'onRoute',
    'onRegister',
  ]

  hooks.handle = (fastify, prop, value) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        hooks.handle(prop, item)
      }
      return
    }
    fastify.addHook(prop, value)
  }

  const methods = [
    'addSchema'
    'addHook',
    'decorateRequest',
    'decorateReply',
  ]

  methods.handle = (fastify, prop, value) => {
    for (const [k, v] of Object.entries(value)) {
      fastify[prop](k, v)
    }
  }

  const bind = [
    'addSchema'
    'addHook',
    'decorateRequest',
    'decorateReply',
    'register',
    'get',
    'head',
    'post',
    'put',
    'delete',
    'options',
    'patch',
    'all',
  ]

  async function apply(obj) {
    const wrapper = async function (fastify) {
      const proxy = new Proxy(source, {
        get (_, prop) {
          if (bind.includes(prop)) {
            return fastify[prop].bind(fastify)
          } else {
            return fastify[prop] 
          }
        }
      })
      if (obj.before) {
        await before(proxy)
      }
      for (const [k, v] of Object.entries(obj)) {
        if (hooks.includes(k)) {
          hooks.handle(fastify, k, v)
        }
        if (methods.includes(k)) {
          methods.handle(fastify, k, v)
        }        
      }
      if (obj.after) {
        await after(proxy)
      }
    }
    await fastify.register(wrapper)
  }

  fastify.decorate('apply', apply)
  done()
}

module.exports = fp(fastifyApply)