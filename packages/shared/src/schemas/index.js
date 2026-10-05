import { z } from "zod";
export const UserSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    email: z.string().email(),
    createdAt: z.string().datetime(),
});
export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true });
export const ApiResponseSchema = (dataSchema) => z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.string().datetime(),
});
//# sourceMappingURL=index.js.map