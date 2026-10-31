import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { parseEther } from "ethers";
import { useNavigate } from "react-router";
import { StatusAlert } from "../components/StatusAlert";
import {
  TransactionStatusModal,
  type TransactionStage,
} from "../components/TransactionStatusModal";
import { WalletButton } from "../components/WalletButton";
import { useBlockBid } from "../hooks/useBlockBid";
import { useWallet } from "../hooks/useWallet";
import { readContractError } from "../services/blockBidService";
import {
  deleteLocalAuctionMetadata,
  saveLocalAuctionMetadata,
} from "../services/localMetadataService";
import {
  AUCTION_CATEGORY_LABELS,
  AuctionCategory,
  type CreateAuctionInput,
} from "../types/blockBid";
import {
  formatDateTime,
  toDateTimeLocalValue,
  unixFromDateTimeLocal,
} from "../utils/format";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_DURATION_SECONDS = 60 * 60;
const MAX_DURATION_SECONDS = 30 * 24 * 60 * 60;
const MIN_INCREMENT_ETH = "0.001";

const STEPS = [
  { label: "Item Details", short: "Item" },
  { label: "Pricing", short: "Pricing" },
  { label: "Schedule", short: "Schedule" },
  { label: "Review", short: "Review" },
] as const;

interface FormState {
  image: File | null;
  imagePreview: string;
  title: string;
  description: string;
  category: AuctionCategory | "";
  startingPriceEth: string;
  reservePriceEth: string;
  minBidIncrementEth: string;
  startTime: string;
  endTime: string;
}

type ErrorKey =
  | "image"
  | "title"
  | "description"
  | "category"
  | "startingPriceEth"
  | "reservePriceEth"
  | "minBidIncrementEth"
  | "startTime"
  | "endTime";

type FormErrors = Partial<Record<ErrorKey, string>>;

function createInitialForm(): FormState {
  const start = new Date(Date.now() + 2 * 60_000);
  const end = new Date(start.getTime() + 6 * 60 * 60_000);

  return {
    image: null,
    imagePreview: "",
    title: "",
    description: "",
    category: "",
    startingPriceEth: "0.10",
    reservePriceEth: "0.25",
    minBidIncrementEth: "0.01",
    startTime: toDateTimeLocalValue(start),
    endTime: toDateTimeLocalValue(end),
  };
}

function positiveEther(value: string, label: string): bigint {
  if (!value.trim()) throw new Error(`${label} is required.`);
  const parsed = parseEther(value);
  if (parsed <= 0n) throw new Error(`${label} must be greater than zero.`);
  return parsed;
}

function validateStep(step: number, form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (step === 0) {
    if (!form.image) errors.image = "Upload an image for the auction.";
    if (!form.title.trim()) errors.title = "Enter a title.";
    else if (form.title.trim().length < 3) errors.title = "Use at least 3 characters.";
    if (!form.description.trim()) errors.description = "Enter a description.";
    else if (form.description.trim().length < 10) {
      errors.description = "Use at least 10 characters so bidders understand the item.";
    }
    if (form.category === "") errors.category = "Select a category.";
  }

  if (step === 1) {
    let startingPrice: bigint | null = null;
    let reservePrice: bigint | null = null;

    try {
      startingPrice = positiveEther(form.startingPriceEth, "Starting price");
    } catch (error) {
      errors.startingPriceEth = error instanceof Error ? error.message : "Enter a valid starting price.";
    }

    try {
      reservePrice = positiveEther(form.reservePriceEth, "Reserve price");
    } catch (error) {
      errors.reservePriceEth = error instanceof Error ? error.message : "Enter a valid reserve price.";
    }

    try {
      const increment = positiveEther(form.minBidIncrementEth, "Minimum increment");
      if (increment < parseEther(MIN_INCREMENT_ETH)) {
        errors.minBidIncrementEth = `The contract minimum is ${MIN_INCREMENT_ETH} ETH.`;
      }
    } catch (error) {
      errors.minBidIncrementEth = error instanceof Error ? error.message : "Enter a valid increment.";
    }

    if (startingPrice !== null && reservePrice !== null && reservePrice < startingPrice) {
      errors.reservePriceEth = "Reserve price cannot be lower than the starting price.";
    }
  }

  if (step === 2) {
    try {
      const startTime = unixFromDateTimeLocal(form.startTime);
      const endTime = unixFromDateTimeLocal(form.endTime);
      const now = Math.floor(Date.now() / 1000);
      const duration = endTime - startTime;

      if (startTime < now) errors.startTime = "Start time cannot be in the past.";
      if (endTime <= startTime) errors.endTime = "End time must be after the start time.";
      else if (duration < MIN_DURATION_SECONDS) errors.endTime = "Minimum duration is 1 hour.";
      else if (duration > MAX_DURATION_SECONDS) errors.endTime = "Maximum duration is 30 days.";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Enter a valid date and time.";
      errors.startTime = message;
      errors.endTime = message;
    }
  }

  return errors;
}

function buildInput(form: FormState, metadataURI: string): CreateAuctionInput {
  if (form.category === "") throw new Error("Select an auction category.");

  return {
    startingPriceEth: form.startingPriceEth,
    reservePriceEth: form.reservePriceEth,
    minBidIncrementEth: form.minBidIncrementEth,
    startTime: unixFromDateTimeLocal(form.startTime),
    endTime: unixFromDateTimeLocal(form.endTime),
    category: form.category,
    metadataURI,
  };
}

export function CreateAuctionPage() {
  const navigate = useNavigate();
  const { createAuction } = useBlockBid();
  const { isConnected, isCorrectNetwork, switchNetwork } = useWallet();
  const [form, setForm] = useState<FormState>(createInitialForm);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDragging, setIsDragging] = useState(false);
  const [transactionStage, setTransactionStage] = useState<TransactionStage>("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      Object.values(AuctionCategory).filter(
        (value): value is AuctionCategory => typeof value === "number",
      ),
    [],
  );

  useEffect(() => {
    return () => {
      if (form.imagePreview) URL.revokeObjectURL(form.imagePreview);
    };
  }, [form.imagePreview]);

  const isSubmitting = !["idle", "error"].includes(transactionStage);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleImage(file: File | null) {
    setErrors((current) => ({ ...current, image: undefined }));

    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrors((current) => ({ ...current, image: "Use PNG, JPG, JPEG, or WebP." }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((current) => ({ ...current, image: "Image must be 5 MB or smaller." }));
      return;
    }

    const preview = URL.createObjectURL(file);
    setForm((current) => ({ ...current, image: file, imagePreview: preview }));
  }

  function removeImage() {
    setForm((current) => ({ ...current, image: null, imagePreview: "" }));
  }

  function goToStep(nextStep: number) {
    if (nextStep > step) {
      const nextErrors = validateStep(step, form);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }
    }

    setErrors({});
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setStartOffset(offsetMilliseconds: number) {
    const existingStart = new Date(form.startTime).getTime();
    const existingEnd = new Date(form.endTime).getTime();
    const existingDuration = existingEnd - existingStart;
    const duration = Number.isFinite(existingDuration)
      ? Math.max(MIN_DURATION_SECONDS * 1_000, existingDuration)
      : 6 * 60 * 60_000;
    const start = new Date(Date.now() + offsetMilliseconds);
    const end = new Date(start.getTime() + duration);

    setForm((current) => ({
      ...current,
      startTime: toDateTimeLocalValue(start),
      endTime: toDateTimeLocalValue(end),
    }));
    setErrors((current) => ({ ...current, startTime: undefined, endTime: undefined }));
  }

  function setDuration(durationMilliseconds: number) {
    const start = new Date(form.startTime);
    const safeStart = Number.isFinite(start.getTime()) ? start : new Date(Date.now() + 2 * 60_000);
    updateField("endTime", toDateTimeLocalValue(new Date(safeStart.getTime() + durationMilliseconds)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const allErrors = [0, 1, 2].map((value) => validateStep(value, form));
    const firstInvalidStep = allErrors.findIndex((value) => Object.keys(value).length > 0);
    if (firstInvalidStep !== -1) {
      setStep(firstInvalidStep);
      setErrors(allErrors[firstInvalidStep]);
      return;
    }
    if (!form.image) return;

    let localUri: string | null = null;
    setTransactionError(null);
    setTransactionHash(null);
    setTransactionStage("preparing");

    try {
      localUri = await saveLocalAuctionMetadata(
        {
          name: form.title.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          category: AUCTION_CATEGORY_LABELS[form.category as AuctionCategory],
          createdAt: new Date().toISOString(),
        },
        form.image,
      );

      const input = buildInput(form, localUri);
      setTransactionStage("wallet");

      const result = await createAuction(input, {
        onSubmitted: (hash) => {
          setTransactionHash(hash);
          setTransactionStage("confirming");
        },
      });

      setTransactionHash(result.hash);
      setTransactionStage("success");
      window.setTimeout(() => navigate(`/auction/${result.auctionId.toString()}`), 1_100);
    } catch (submitError) {
      if (localUri) {
        try {
          await deleteLocalAuctionMetadata(localUri);
        } catch {
          // The abandoned local record is harmless if cleanup is unavailable.
        }
      }
      setTransactionError(readContractError(submitError));
      setTransactionStage("error");
    }
  }

  return (
    <div className="mx-auto max-w-[680px] space-y-7">
      <header className="text-center">
        <p className="eyebrow">Launch a listing</p>
        <h1 className="mt-3 bg-gradient-to-r from-white via-violet-100 to-cyan-200 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          Create a cosmic auction
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
          Add the item, set the on-chain rules, and review everything before MetaMask opens.
        </p>
      </header>

      {!isConnected ? (
        <div className="surface-card-strong cosmic-border p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-200">
            <WalletIcon />
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">Connect your seller wallet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
            The connected address becomes the auction seller and signs the final transaction.
          </p>
          <div className="mt-6 flex justify-center"><WalletButton /></div>
        </div>
      ) : !isCorrectNetwork ? (
        <StatusAlert
          tone="error"
          title="Wrong network"
          action={<button type="button" className="button-primary" onClick={() => void switchNetwork()}>Switch network</button>}
        >
          Switch MetaMask to the network configured for this BlockBid deployment.
        </StatusAlert>
      ) : (
        <form className="surface-card-strong cosmic-border overflow-hidden" onSubmit={handleSubmit}>
          <WizardProgress currentStep={step} onSelect={(index) => index < step && goToStep(index)} />

          <div className="p-5 sm:p-7">
            <div key={step} className="step-enter">
              {step === 0 ? (
                <ItemDetailsStep
                  form={form}
                  errors={errors}
                  categories={categories}
                  isDragging={isDragging}
                  onDragState={setIsDragging}
                  onImage={handleImage}
                  onRemoveImage={removeImage}
                  onUpdate={updateField}
                />
              ) : null}

              {step === 1 ? <PricingStep form={form} errors={errors} onUpdate={updateField} /> : null}

              {step === 2 ? (
                <ScheduleStep
                  form={form}
                  errors={errors}
                  onUpdate={updateField}
                  onStartOffset={setStartOffset}
                  onDuration={setDuration}
                />
              ) : null}

              {step === 3 ? <ReviewStep form={form} onEdit={setStep} /> : null}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-5">
              {step > 0 ? (
                <button type="button" className="button-secondary" disabled={isSubmitting} onClick={() => goToStep(step - 1)}>
                  <BackIcon /> Back
                </button>
              ) : <span />}

              {step < STEPS.length - 1 ? (
                <button type="button" className="button-primary" onClick={() => goToStep(step + 1)}>
                  Continue <ArrowIcon />
                </button>
              ) : (
                <button type="submit" className="button-primary min-w-40" disabled={isSubmitting}>
                  <RocketIcon /> Create auction
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      <TransactionStatusModal
        stage={transactionStage}
        error={transactionError}
        hash={transactionHash}
        onClose={() => setTransactionStage("idle")}
      />
    </div>
  );
}

function WizardProgress({ currentStep, onSelect }: { currentStep: number; onSelect: (step: number) => void }) {
  return (
    <div className="border-b border-white/[0.07] bg-black/15 px-4 py-5 sm:px-7">
      <div className="relative grid grid-cols-4 gap-2">
        <div className="absolute left-[12.5%] right-[12.5%] top-4 h-px bg-white/10" />
        <div
          className="absolute left-[12.5%] top-4 h-px bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 75}%` }}
        />
        {STEPS.map((item, index) => {
          const completed = index < currentStep;
          const active = index === currentStep;
          return (
            <button
              key={item.label}
              type="button"
              disabled={!completed}
              className="relative flex flex-col items-center gap-2 text-center disabled:cursor-default"
              onClick={() => onSelect(index)}
            >
              <span className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border text-xs font-black transition ${completed ? "border-cyan-300/35 bg-cyan-400/15 text-cyan-200" : active ? "border-violet-300/45 bg-violet-500 text-white shadow-[0_0_22px_rgba(139,92,246,.55)]" : "border-white/10 bg-cosmos-900 text-slate-600"}`}>
                {completed ? <CheckIcon /> : index + 1}
              </span>
              <span className={`hidden text-[10px] font-bold uppercase tracking-[0.12em] sm:block ${active ? "text-white" : completed ? "text-cyan-300" : "text-slate-600"}`}>
                {item.label}
              </span>
              <span className={`text-[10px] font-bold sm:hidden ${active ? "text-white" : completed ? "text-cyan-300" : "text-slate-600"}`}>
                {item.short}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface StepProps {
  form: FormState;
  errors: FormErrors;
  onUpdate: <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void;
}

function ItemDetailsStep({
  form,
  errors,
  categories,
  isDragging,
  onDragState,
  onImage,
  onRemoveImage,
  onUpdate,
}: StepProps & {
  categories: AuctionCategory[];
  isDragging: boolean;
  onDragState: (value: boolean) => void;
  onImage: (file: File | null) => void;
  onRemoveImage: () => void;
}) {
  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    onDragState(false);
    onImage(event.dataTransfer.files[0] ?? null);
  }

  return (
    <section className="space-y-5">
      <StepHeading step="Step 1 of 4" title="Item details" description="Give bidders a clear image and a useful description." />

      {form.imagePreview ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <img src={form.imagePreview} alt="Auction preview" className="aspect-[16/9] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{form.image?.name}</p>
              <p className="text-xs text-slate-400">{form.image ? `${(form.image.size / 1024 / 1024).toFixed(2)} MB` : ""}</p>
            </div>
            <div className="flex gap-2">
              <label className="button-secondary cursor-pointer px-3 py-2 text-xs">
                Replace
                <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event: ChangeEvent<HTMLInputElement>) => onImage(event.target.files?.[0] ?? null)} />
              </label>
              <button type="button" className="button-secondary px-3 py-2 text-xs" onClick={onRemoveImage}>Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <label
          className={`group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center transition ${isDragging ? "border-violet-300 bg-violet-500/12" : errors.image ? "border-red-400/45 bg-red-400/[0.05]" : "border-white/15 bg-white/[0.025] hover:border-violet-400/45 hover:bg-violet-500/[0.055]"}`}
          onDragEnter={(event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); onDragState(true); }}
          onDragOver={(event: DragEvent<HTMLLabelElement>) => event.preventDefault()}
          onDragLeave={() => onDragState(false)}
          onDrop={handleDrop}
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/15 bg-violet-500/10 text-violet-200 transition group-hover:scale-105"><UploadIcon /></span>
          <span className="mt-4 text-sm font-bold text-white">Drag and drop an image</span>
          <span className="mt-1 text-xs text-slate-500">or click to browse · PNG, JPG, JPEG, WebP · max 5 MB</span>
          <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event: ChangeEvent<HTMLInputElement>) => onImage(event.target.files?.[0] ?? null)} />
        </label>
      )}
      <FieldError message={errors.image} />

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,.7fr)]">
        <label className="form-label">
          Title
          <input className="form-control" value={form.title} maxLength={80} placeholder="Vintage space watch" onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdate("title", event.target.value)} />
          <FieldError message={errors.title} />
        </label>
        <label className="form-label">
          Category
          <select className="form-control" value={form.category} onChange={(event: ChangeEvent<HTMLSelectElement>) => onUpdate("category", event.target.value === "" ? "" : Number(event.target.value) as AuctionCategory)}>
            <option value="">Select category</option>
            {categories.map((category) => <option key={category} value={category}>{AUCTION_CATEGORY_LABELS[category]}</option>)}
          </select>
          <FieldError message={errors.category} />
        </label>
      </div>

      <label className="form-label">
        Description
        <textarea className="form-control min-h-28 resize-none" value={form.description} maxLength={600} placeholder="Describe the item, condition, and anything bidders should know." onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onUpdate("description", event.target.value)} />
        <div className="flex justify-between gap-3"><FieldError message={errors.description} /><span className="form-help ml-auto">{form.description.length}/600</span></div>
      </label>
    </section>
  );
}

function PricingStep({ form, errors, onUpdate }: StepProps) {
  return (
    <section className="space-y-5">
      <StepHeading step="Step 2 of 4" title="Pricing" description="Set the ETH rules enforced by the smart contract." />
      <EthField label="Starting price" help="The first acceptable bid." value={form.startingPriceEth} error={errors.startingPriceEth} onChange={(value) => onUpdate("startingPriceEth", value)} />
      <EthField label="Reserve price" help="The minimum amount required for a successful sale." value={form.reservePriceEth} error={errors.reservePriceEth} onChange={(value) => onUpdate("reservePriceEth", value)} />
      <EthField label="Minimum bid increment" help="The minimum increase between bids." value={form.minBidIncrementEth} error={errors.minBidIncrementEth} onChange={(value) => onUpdate("minBidIncrementEth", value)} />
      <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.045] p-4 text-sm leading-6 text-cyan-100/75">
        All values are converted with <span className="font-mono text-cyan-200">ethers.parseEther()</span> before the transaction is sent.
      </div>
    </section>
  );
}

function safeUnix(value: string): number {
  try {
    return unixFromDateTimeLocal(value);
  } catch {
    return 0;
  }
}

function ScheduleStep({
  form,
  errors,
  onUpdate,
  onStartOffset,
  onDuration,
}: StepProps & { onStartOffset: (offset: number) => void; onDuration: (duration: number) => void }) {
  const durationSeconds = Math.max(0, safeUnix(form.endTime) - safeUnix(form.startTime));

  return (
    <section className="space-y-5">
      <StepHeading step="Step 3 of 4" title="Schedule" description="Choose when bidding opens and how long it remains active." />

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Quick start</p>
        <div className="flex flex-wrap gap-2">
          <QuickButton label="Immediately" onClick={() => onStartOffset(90_000)} />
          <QuickButton label="In 1 hour" onClick={() => onStartOffset(60 * 60_000)} />
          <QuickButton label="Tomorrow" onClick={() => onStartOffset(24 * 60 * 60_000)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="form-label">
          Start time
          <input className="form-control" type="datetime-local" min={toDateTimeLocalValue(new Date())} value={form.startTime} onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdate("startTime", event.target.value)} />
          <FieldError message={errors.startTime} />
        </label>
        <label className="form-label">
          End time
          <input className="form-control" type="datetime-local" value={form.endTime} onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdate("endTime", event.target.value)} />
          <FieldError message={errors.endTime} />
        </label>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Duration shortcuts</p>
        <div className="flex flex-wrap gap-2">
          {[
            ["1 hour", 1], ["6 hours", 6], ["1 day", 24], ["3 days", 72], ["7 days", 168],
          ].map(([label, hours]) => <QuickButton key={String(label)} label={String(label)} onClick={() => onDuration(Number(hours) * 60 * 60_000)} />)}
        </div>
      </div>

      <div className="muted-panel flex items-center justify-between gap-4 p-4">
        <div><p className="text-xs text-slate-500">Calculated duration</p><p className="mt-1 font-bold text-white">{formatDuration(durationSeconds)}</p></div>
        <div className="text-right"><p className="text-xs text-slate-500">Contract limits</p><p className="mt-1 text-sm font-semibold text-slate-300">1 hour – 30 days</p></div>
      </div>
    </section>
  );
}

function ReviewStep({ form, onEdit }: { form: FormState; onEdit: (step: number) => void }) {
  const start = safeUnix(form.startTime);
  const end = safeUnix(form.endTime);

  return (
    <section className="space-y-5">
      <StepHeading step="Step 4 of 4" title="Review" description="Confirm the listing before MetaMask opens." />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
        <img src={form.imagePreview} alt="Auction item" className="aspect-[16/8] w-full object-cover" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div><p className="eyebrow">{form.category === "" ? "Uncategorized" : AUCTION_CATEGORY_LABELS[form.category]}</p><h3 className="mt-2 text-xl font-black text-white">{form.title}</h3></div>
            <EditButton onClick={() => onEdit(0)} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">{form.description}</p>
        </div>
      </div>

      <ReviewSection title="Pricing" onEdit={() => onEdit(1)}>
        <ReviewValue label="Starting price" value={`${form.startingPriceEth} ETH`} />
        <ReviewValue label="Reserve price" value={`${form.reservePriceEth} ETH`} />
        <ReviewValue label="Minimum increment" value={`${form.minBidIncrementEth} ETH`} />
      </ReviewSection>

      <ReviewSection title="Schedule" onEdit={() => onEdit(2)}>
        <ReviewValue label="Starts" value={formatDateTime(start)} />
        <ReviewValue label="Ends" value={formatDateTime(end)} />
        <ReviewValue label="Duration" value={formatDuration(end - start)} />
      </ReviewSection>

      <div className="rounded-2xl border border-violet-400/15 bg-violet-500/[0.055] p-4 text-sm leading-6 text-violet-100/75">
        Your image and item details will be stored locally off-chain. Only the compact metadata reference and auction rules are written to the smart contract.
      </div>
    </section>
  );
}

function StepHeading({ step, title, description }: { step: string; title: string; description: string }) {
  return <div><p className="eyebrow">{step}</p><h2 className="mt-2 text-2xl font-black text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>;
}

function EthField({ label, help, value, error, onChange }: { label: string; help: string; value: string; error?: string; onChange: (value: string) => void }) {
  return (
    <label className="form-label">
      {label}
      <div className="relative"><input className="form-control pr-16" type="number" min="0" step="any" value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-violet-300/15 bg-violet-400/10 px-2 py-1 text-[10px] font-black text-violet-200">ETH</span></div>
      <span className="form-help">{help}</span>
      <FieldError message={error} />
    </label>
  );
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return <div className="muted-panel p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-white">{title}</h3><EditButton onClick={onEdit} /></div><div className="grid gap-4 sm:grid-cols-3">{children}</div></div>;
}

function ReviewValue({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-200">{value}</p></div>;
}

function EditButton({ onClick }: { onClick: () => void }) {
  return <button type="button" className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-bold text-slate-300 transition hover:border-violet-400/30 hover:text-white" onClick={onClick}>Edit</button>;
}

function QuickButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-violet-400/30 hover:bg-violet-400/[0.07] hover:text-white" onClick={onClick}>{label}</button>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-xs font-semibold text-red-300">{message}</span> : null;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "Not set";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function UploadIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>; }
function ArrowIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>; }
function BackIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m6-6-6 6 6 6"/></svg>; }
function CheckIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m5 12 4 4L19 6"/></svg>; }
function RocketIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 5c2.5-2.5 5.5-2 5.5-2s.5 3-2 5.5l-4 4-4-4 4.5-3.5Z"/><path d="m9.5 8.5-4 .5-2 2 5 1m4 4 .5 4 2-2 1-5m-8 1-2 2"/></svg>; }
function WalletIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3v-10a3 3 0 0 1 3-3h11"/><path d="M16 11.5h5v4h-5a2 2 0 1 1 0-4Z"/></svg>; }
