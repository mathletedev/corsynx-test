import { hash, verify } from "argon2";
import {
	Arg,
	Ctx,
	Field,
	InputType,
	Mutation,
	ObjectType,
	Resolver
} from "type-graphql";
import { User } from "../entities/User";
import { MyContext } from "../types";

@InputType()
class UsernamePasswordInput {
	@Field()
	username: string;

	@Field()
	password: string;
}

@ObjectType()
class FieldError {
	@Field()
	field: string;

	@Field()
	message: string;
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

@Resolver()
export class UserResolver {
	@Mutation(() => UserResponse)
	async register(
		@Arg("options") options: UsernamePasswordInput,
		@Ctx() { em }: MyContext
	): Promise<UserResponse> {
		if (options.username.length <= 2) {
			return {
				errors: [
					{
						field: "username",
						message: "Username must be at least 3 characters long"
					}
				]
			};
		}
		if (options.password.length <= 4) {
			return {
				errors: [
					{
						field: "username",
						message: "Password must be at least 5 characters long"
					}
				]
			};
		}

		const hashed = await hash(options.password);
		const user = em.create(User, {
			username: options.username,
			password: hashed
		});

		try {
			await em.persistAndFlush(user);
		} catch (err) {
			if (err.code === "23505") {
				return {
					errors: [
						{
							field: "username",
							message: "Username is taken"
						}
					]
				};
			}
		}
		return { user };
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg("options") options: UsernamePasswordInput,
		@Ctx() { em }: MyContext
	): Promise<UserResponse> {
		const user = await em.findOne(User, { username: options.username });
		if (!user) {
			return {
				errors: [
					{
						field: "username",
						message: `Could not find a user with username ${options.username}`
					}
				]
			};
		}
		const valid = await verify(user.password, options.password);
		if (!valid) {
			return {
				errors: [
					{
						field: "password",
						message: "Invalid password"
					}
				]
			};
		}

		return { user };
	}
}
