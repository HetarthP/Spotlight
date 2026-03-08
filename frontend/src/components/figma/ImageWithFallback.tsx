import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallback?: string;
}

const ImageWithFallback = ({
    src,
    fallback = "https://images.unsplash.com/photo-1594122230689-45899d982f49?q=80&w=800&auto=format&fit=crop",
    alt,
    className,
    ...props
}: ImageWithFallbackProps) => {
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
    }, [src]);

    return (
        <img
            src={imgSrc}
            alt={alt}
            onError={() => setImgSrc(fallback)}
            className={cn(className)}
            {...props}
        />
    );
};

export { ImageWithFallback };
