import { z } from 'zod';

export const movementSchema = z
  .object({
    type: z.enum(['in', 'out', 'adjust']),
    item_id: z.string().min(1, 'Choose an item.'),
    quantity: z.string().trim(),
    remarks: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    const quantity = Number(value.quantity);
    if (value.quantity === '' || !Number.isFinite(quantity)) {
      ctx.addIssue({ code: 'custom', path: ['quantity'], message: 'Enter a quantity.' });
    } else if (value.type === 'adjust' && quantity === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantity'],
        message: 'An adjustment cannot be zero.',
      });
    } else if (value.type !== 'adjust' && quantity <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantity'],
        message: 'Quantity must be more than zero.',
      });
    }
    if (value.type === 'adjust' && !value.remarks) {
      ctx.addIssue({
        code: 'custom',
        path: ['remarks'],
        message: 'Say why the count is being adjusted.',
      });
    }
  });

export type MovementForm = z.infer<typeof movementSchema>;

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(2, 'Enter the item name.'),
  unit_id: z.string().min(1, 'Choose a unit.'),
  reorder_level: z
    .string()
    .trim()
    .refine((value) => value !== '' && Number(value) >= 0, 'Enter a reorder level.'),
});

export type InventoryItemForm = z.infer<typeof inventoryItemSchema>;
