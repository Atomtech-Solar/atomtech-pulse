import { motion } from "framer-motion";

interface StationPhotoBannerProps {
  mainPhotoUrl: string;
  name: string;
}

export default function StationPhotoBanner({
  mainPhotoUrl,
  name,
}: StationPhotoBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative h-40 overflow-hidden rounded-xl sm:h-48"
    >
      <img
        src={mainPhotoUrl}
        alt={name}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h2 className="text-xl font-semibold text-white drop-shadow-lg sm:text-2xl">
          {name}
        </h2>
      </div>
    </motion.div>
  );
}
