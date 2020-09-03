const { GraphQLServer, PubSub } = require('graphql-yoga');

const messages = []

const typeDefs = `
  type Message {
    id: ID!
    user: String!
    content: String!
  }

  type Query {
    messages: [Message!]
  }

  type Mutation {
    postMessage(user: String!, content: String!): ID!
  }

  type Subscription {
    messages: [Message!]
  }
`

const subscribers = [];
const onMessagesUpdates = (callback) => subscribers.push(callback)

const resolvers = {
  Query: {
    messages: () => messages,
  },

  Mutation: {
    postMessage: (__, { user, content }) => {
      const id = messages.length;
      
      messages.push({
        id,
        user,
        content
      })
      subscribers.forEach(callback => callback());

      return id;
    }
  },

  Subscription: {
    messages: {
      subscribe: (_, args, { pubsub }) => {
        const channel = Math.random().toString(36).slice(2, 15);
        onMessagesUpdates(() => pubsub.publish(channel, { messages }));
        setTimeout(() => pubsub.publish(channel, { messages }), 0);

        return pubsub.asyncIterator(channel);
      }
    }
  }
}

const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server.start(({ port }) => {
  console.log(`Server on http://localhost:${port}`);
});