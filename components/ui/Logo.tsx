export default function Logo({ className = "", size = "text-2xl" }: { className?: string, size?: string }) {
    return (
        <span className={`inline-flex items-center gap-2 font-black tracking-[0.02em] ${size} ${className}`}>
            <span className="inline-flex items-center justify-center rounded-md bg-indigo-700 px-2 py-1 text-white shadow">A</span>
            <span className="text-white">ARAE</span>
            <span className="text-sm text-gray-300 ml-1">LMS</span>
        </span>
    );
}
