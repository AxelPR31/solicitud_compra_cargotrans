import axios from 'axios'
import { z } from 'zod'

const ApiErrorSchema = z.object({
  message: z.string().min(1),
  error: z
    .object({
      message: z.string().min(1).optional(),
      response: z.object({ message: z.string().min(1).optional() }).optional(),
    })
    .optional(),
})

export const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const parsedError = ApiErrorSchema.safeParse(error.response?.data)
  if (parsedError.success) {
    return (
      parsedError.data.message ||
      parsedError.data.error?.message ||
      parsedError.data.error?.response?.message ||
      fallback
    )
  }

  return error.message || fallback
}
