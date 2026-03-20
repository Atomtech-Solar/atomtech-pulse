import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";

interface StationPhotoGalleryProps {
  photoUrls: string[];
}

export default function StationPhotoGallery({ photoUrls }: StationPhotoGalleryProps) {
  if (photoUrls.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent className="-ml-2">
          {photoUrls.map((url, i) => (
            <CarouselItem key={i} className="pl-2 basis-[85%] sm:basis-[70%]">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border"
              >
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="h-32 w-full object-cover transition-transform hover:scale-105 sm:h-40"
                />
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
        {photoUrls.length > 1 && (
          <>
            <CarouselPrevious className="-left-2" />
            <CarouselNext className="-right-2" />
          </>
        )}
      </Carousel>
    </motion.div>
  );
}
