import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import "dotenv-safe/config";
import express from "express";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import mikroConfig from "./mikro-orm.config";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

(async () => {
	const orm = await MikroORM.init(mikroConfig);
	await orm.getMigrator().up();

	const app = express();

	const server = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false
		}),
		context: () => ({ em: orm.em })
	});

	server.applyMiddleware({ app });

	app.listen(process.env.PORT, () => {
		console.log(
			`🚀 Server started at http://localhost${process.env.PORT}${server.graphqlPath} !`
		);
	});
})().catch(console.error);
