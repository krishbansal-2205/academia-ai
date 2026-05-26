import mongoose, { Model, Schema } from 'mongoose';
import { IAssignmentDocument } from '../types';

const QuestionSchema = new Schema(
  {
    number: { type: Number, required: true },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq', 'short', 'long', 'diagram', 'numerical'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Hard'],
      required: true,
    },
    marks: { type: Number, required: true },
    options: { type: [String], default: undefined },
  },
  { _id: false }
);

const SectionSchema = new Schema(
  {
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: { type: [QuestionSchema], required: true },
  },
  { _id: false }
);

const GeneratedPaperSchema = new Schema(
  {
    institutionName: { type: String, required: true },
    examTitle: { type: String, required: true },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    duration: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    date: { type: String, required: true },
    generalInstructions: { type: String, required: true },
    sections: { type: [SectionSchema], required: true },
  },
  { _id: false }
);

const QuestionTypeConfigSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['mcq', 'short', 'long', 'diagram', 'numerical'],
      required: true,
    },
    count: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const AssignmentSchema = new Schema<IAssignmentDocument>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeConfigSchema], required: true },
    totalQuestions: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 1 },
    additionalInstructions: { type: String, default: '' },
    uploadedFileText: { type: String, default: '' },
    materialFileName: { type: String, default: null },
    status: {
      type: String,
      enum: ['draft', 'processing', 'completed', 'failed'],
      default: 'draft',
    },
    pdfStatus: {
      type: String,
      enum: ['idle', 'processing', 'completed', 'failed'],
      default: 'idle',
    },
    generatedPaper: { type: GeneratedPaperSchema, default: null },
    pdfPath: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

AssignmentSchema.index({ status: 1, createdAt: -1 });
AssignmentSchema.index({ pdfStatus: 1 });
AssignmentSchema.index({ createdAt: -1 });

const Assignment: Model<IAssignmentDocument> = mongoose.model<IAssignmentDocument>(
  'Assignment',
  AssignmentSchema
);

export default Assignment;
