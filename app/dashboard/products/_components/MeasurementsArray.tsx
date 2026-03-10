"use client"

import { useFieldArray, Control, Controller } from "react-hook-form"
import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FullProductInsertValues } from "@/db/models/product"

export function MeasurementsArray({
	nestIndex,
	control,
}: {
	nestIndex: number
	control: Control<FullProductInsertValues>
}) {
	const { fields, append, remove } = useFieldArray({
		control,
		name: `sizeVariants.${nestIndex}.measurements` as const,
	})

	return (
		<div className="space-y-4 pl-4 border-l border-primary/10 mt-4">
			<div className="flex justify-between items-center">
				<p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
					Technical Specifications
				</p>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() =>
						append({ key: "", value: "0.00", unit: "cm" })
					}
					className="h-6 text-[8px] uppercase tracking-widest hover:bg-primary/5"
				>
					<Plus className="h-2 w-2 mr-1" /> Add Spec
				</Button>
			</div>

			{fields.length === 0 && (
				<p className="text-[9px] text-muted-foreground/50 italic">
					No specific measurements added for this variant.
				</p>
			)}

			<div className="space-y-2">
				{fields.map((field, mIndex) => (
					<div
						key={field.id}
						className="flex gap-2 items-center group/spec"
					>
						<Controller
							control={control}
							name={`sizeVariants.${nestIndex}.measurements.${mIndex}.key`}
							render={({ field }) => (
								<Input
									{...field}
									placeholder="e.g. Chest"
									className="h-8 rounded-none text-[10px] bg-background border-primary/10 focus-visible:ring-0 focus-visible:border-primary/40 transition-colors"
								/>
							)}
						/>
						<Controller
							control={control}
							name={`sizeVariants.${nestIndex}.measurements.${mIndex}.value`}
							render={({ field }) => (
								<Input
									{...field}
									placeholder="0.00"
									className="h-8 rounded-none text-[10px] bg-background border-primary/10 w-24 font-mono focus-visible:ring-0"
								/>
							)}
						/>
						<Controller
							control={control}
							name={`sizeVariants.${nestIndex}.measurements.${mIndex}.unit`}
							render={({ field }) => (
								<select
									{...field}
									className="h-8 rounded-none text-[10px] border border-primary/10 bg-background px-1 focus:outline-none focus:border-primary/40"
								>
									<option value="cm">cm</option>
									<option value="in">in</option>
								</select>
							)}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => remove(mIndex)}
							className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
						>
							<Trash2 className="h-3 w-3" />
						</Button>
					</div>
				))}
			</div>
		</div>
	)
}
