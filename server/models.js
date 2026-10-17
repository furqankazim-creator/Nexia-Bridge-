import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ROLES = ['parent', 'behavior', 'speech', 'ot', 'remedial', 'teacher', 'supervisor', 'admin'];
export const STAFF_ROLES = ROLES.filter((r) => r !== 'parent');

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    childIds: { type: [String], default: [] },
    // An administrator can switch an account off: it can no longer sign in or use an existing session.
    disabled: { type: Boolean, default: false },
    // The centre a staff member works in. For an administrator it is the admin's own scope:
    // none = the whole organisation, a centre id = that centre only.
    // Shown on the person's own profile, set by the administrator.
    title: { type: String, default: '', maxlength: 80 },
    phone: { type: String, default: '', maxlength: 30 },
    centerId: { type: String, default: null },
    // Visibility: 'assigned' = only the children an administrator linked; 'center' = every child in the centre.
    scope: { type: String, enum: ['assigned', 'center'], default: 'assigned' },
  },
  { timestamps: true }
);

const childSchema = new Schema({
  _id: { type: String }, // e.g. "child-lama": matches the id used by the app
  name: { type: String, required: true },
  inviteCode: { type: String, required: true, unique: true }, // parents enter this to join their child
  centerId: { type: String, default: null },
  archived: { type: Boolean, default: false }, // closed case: read-only, hidden from the clinical team
  archivedAt: { type: Date },
});

export const CENTER_TYPES = ['special_education', 'speech_therapy', 'clinic'];
const centerSchema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    type: { type: String, enum: CENTER_TYPES, required: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const INVOICE_STATUSES = ['draft', 'issued', 'paid', 'void'];
const invoiceSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    centerId: { type: String, default: null },
    childId: { type: String, default: null },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 0 }, // whole currency units, two decimals
    currency: { type: String, default: 'SAR' },
    status: { type: String, enum: INVOICE_STATUSES, default: 'draft' },
    dueDate: { type: String }, // YYYY-MM-DD
    issuedAt: { type: Date },
    paidAt: { type: Date },
    createdBy: { type: String },
  },
  { timestamps: true }
);

/**
 * Every shared clinical item (tasks, plans, ABC events, messages ...) is one Record.
 * `seq` is a global, strictly increasing change counter, so clients can ask
 * "what changed since seq N" without clock-skew problems. Deleted items stay as tombstones.
 */
const recordSchema = new Schema({
  col: { type: String, required: true },
  rid: { type: String, required: true },
  childId: { type: String, required: true, index: true },
  data: { type: Schema.Types.Mixed, default: {} },
  deleted: { type: Boolean, default: false },
  seq: { type: Number, required: true, index: true },
  updatedBy: { type: String },
  updatedAt: { type: Date, default: Date.now },
});
recordSchema.index({ col: 1, rid: 1 }, { unique: true });

/** Append-only trail of who did what (no clinical content is stored here). */
const auditSchema = new Schema({
  at: { type: Date, default: Date.now, index: true },
  userId: { type: String },
  userName: { type: String },
  role: { type: String },
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
});

const counterSchema = new Schema({ _id: String, n: { type: Number, default: 0 } });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Child = mongoose.models.Child || mongoose.model('Child', childSchema);
export const RecordDoc = mongoose.models.Record || mongoose.model('Record', recordSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditSchema);
const settingSchema = new Schema({ _id: String, data: { type: Schema.Types.Mixed, default: {} } });
export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
export const Center = mongoose.models.Center || mongoose.model('Center', centerSchema);
export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

export const nextSeq = async () => (await Counter.findOneAndUpdate({ _id: 'seq' }, { $inc: { n: 1 } }, { upsert: true, new: true })).n;
