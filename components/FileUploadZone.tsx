"use client";

import { useId, useRef, useState } from "react";
import { formatFileSize } from "@/lib/format";
import type { CalculationFileKind } from "@/lib/types";

type FileUploadZoneProps = {
  label: string;
  description: string;
  name: CalculationFileKind;
  onFileChange?: (file: File | null) => void;
};

export function FileUploadZone({ label, description, name, onFileChange }: FileUploadZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function setSelectedFile(file: File | null) {
    setFileName(file?.name ?? null);
    setFileSize(file?.size ?? null);
    onFileChange?.(file);
  }

  function attachDroppedFile(file: File) {
    if (!inputRef.current) {
      setSelectedFile(file);
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputRef.current.files = dataTransfer.files;
    setSelectedFile(file);
  }

  return (
    <label
      htmlFor={inputId}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files[0];

        if (file) {
          attachDroppedFile(file);
        }
      }}
      className={`block cursor-pointer rounded-[1.5rem] border border-dashed p-4 transition ${
        isDragging
          ? "border-stone-500 bg-white"
          : "border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-white"
      }`}
    >
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        className="sr-only"
        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
        onChange={(event) => {
          const file = event.target.files?.[0];
          setSelectedFile(file ?? null);
        }}
      />
      <span className="text-sm font-semibold text-stone-900">{label}</span>
      <span className="mt-1 block text-sm leading-5 text-stone-500">
        {fileName && fileSize
          ? `${fileName} · ${formatFileSize(fileSize)}`
          : `${description}. Нажмите или перетащите файл сюда.`}
      </span>
    </label>
  );
}
