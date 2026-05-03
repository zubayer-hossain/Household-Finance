import { describe, expect, it } from "vitest";

import { transactionService } from "@/features/transactions/services/transaction.service";
import { transactionAttachmentService } from "@/features/transactions/services/transaction-attachment.service";

describe("transaction services surface", () => {
  it("exposes transaction CRUD helpers", () => {
    expect(typeof transactionService.listTransactions).toBe("function");
    expect(typeof transactionService.getTransaction).toBe("function");
    expect(typeof transactionService.createTransaction).toBe("function");
    expect(typeof transactionService.createQuickExpense).toBe("function");
    expect(typeof transactionService.updateTransaction).toBe("function");
    expect(typeof transactionService.softDeleteTransaction).toBe("function");
  });

  it("exposes attachment helpers", () => {
    expect(typeof transactionAttachmentService.listForTransaction).toBe(
      "function"
    );
    expect(typeof transactionAttachmentService.upload).toBe("function");
    expect(typeof transactionAttachmentService.remove).toBe("function");
    expect(typeof transactionAttachmentService.createSignedUrl).toBe(
      "function"
    );
  });
});
