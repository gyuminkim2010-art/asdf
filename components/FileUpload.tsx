"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 파일 정보를 담을 타입 정의
type FileItem = {
  id: string;
  file: File;
};

export default function FileUpload() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 용량 계산 함수 (KB, MB 단위)
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // 탐색기 열기
  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  // 파일 선택 시 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    // 같은 파일을 지웠다 다시 올릴 수 있도록 값 초기화
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 드래그 앤 드롭 이벤트 처리
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  // 파일 목록에 추가
  const addFiles = (newFiles: File[]) => {
    const fileItems = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
    }));
    setFiles((prev) => [...prev, ...fileItems]);
  };

  // 파일 삭제
  const removeFile = (idToRemove: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  return (
    <div className="w-full">
      {/* 1. 드래그 앤 드롭 박스 */}
      <div
        onClick={handleBoxClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed p-10 transition-all duration-300 ${
          isDragging
            ? "border-[#171717] bg-[#f0efea]"
            : "border-black/10 bg-[#f7f6f2] hover:bg-[#f0efea]"
        }`}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* 업로드 아이콘 (기본 SVG) */}
        <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#444]">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        
        <p className="text-base font-bold text-[#171717]">
          클릭하거나 파일을 이곳에 드래그하세요
        </p>
        <p className="mt-1 text-sm text-[#666]">
          PDF, 이미지, 문서 파일 등 업로드 가능
        </p>
      </div>

      {/* 2. 첨부된 파일 리스트 */}
      <div className="mt-4 space-y-3">
        <AnimatePresence>
          {files.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between rounded-[20px] border border-black/5 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {/* 파일 아이콘 */}
                <div className="rounded-xl bg-[#f7f6f2] p-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#666]">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                </div>
                <div className="flex flex-col truncate">
                  <span className="truncate text-sm font-bold text-[#171717]">
                    {item.file.name}
                  </span>
                  <span className="text-xs text-[#7a7a7a]">
                    {formatFileSize(item.file.size)}
                  </span>
                </div>
              </div>

              {/* 삭제 버튼 */}
              <button
                onClick={() => removeFile(item.id)}
                className="ml-4 rounded-full p-2 text-[#999] transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label="파일 삭제"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}