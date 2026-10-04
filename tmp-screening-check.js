const { z } = require('zod');

const screeningTypeEnum = z.enum(['mammogram', 'ultrasound', 'clinical_exam', 'screening', 'mri', 'self_exam']);
const createScreeningSchema = z.object({
  userId: z.string().optional(),
  screeningType: screeningTypeEnum,
  scheduledDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: 'scheduledDate should be valid ISO date' }),
  notes: z.string().trim().max(1000).optional(),
}).strict();

const cases = {
  camelCaseValid: { screeningType: 'mammogram', scheduledDate: '2026-10-15', notes: 'checkup' },
  flutterPayload: { screeningType: 'self_exam', scheduledDate: '2026-10-15', notes: '' },
  snakeCaseWrong: { screening_type: 'mammogram', scheduled_date: '2026-10-15', notes: 'checkup' },
  shortTypeWrong: { type: 'mammogram', date: '2026-10-15', notes: 'checkup' },
  extraField: { screeningType: 'mammogram', scheduledDate: '2026-10-15', notes: 'checkup', status: 'pending' },
  invalidEnum: { screeningType: 'xray', scheduledDate: '2026-10-15' },
  invalidDate: { screeningType: 'mammogram', scheduledDate: 'not-a-date' },
};

for (const [name, payload] of Object.entries(cases)) {
  const parsed = createScreeningSchema.safeParse(payload);
  console.log('CASE=' + name + ' SUCCESS=' + parsed.success);
  if (!parsed.success) {
    console.log(JSON.stringify(parsed.error.issues, null, 2));
  }
}
