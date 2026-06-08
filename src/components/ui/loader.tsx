// src/components/Loader.tsx

import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";

const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

const Loader = ({
  title = "Configuring your account...",
  subtitle = "Please wait while we prepare everything for you",
  size = "md",
  className,
  ...props
}: LoaderProps) => {
  const sizeConfig = {
    sm: {
      container: "w-20 h-20",
      titleClass: "text-sm font-medium",
      subtitleClass: "text-xs",
      spacing: "space-y-2",
      maxWidth: "max-w-48",
    },
    md: {
      container: "w-32 h-32",
      titleClass: "text-base font-medium",
      subtitleClass: "text-sm",
      spacing: "space-y-3",
      maxWidth: "max-w-56",
    },
    lg: {
      container: "w-40 h-40",
      titleClass: "text-lg font-semibold",
      subtitleClass: "text-base",
      spacing: "space-y-4",
      maxWidth: "max-w-64",
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-8 p-8",
        className
      )}
      {...props}
    >
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        className={cn("relative", config.container)}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: [0.4, 0, 0.6, 1],
        }}
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgb(0, 0, 0) 90deg, transparent 180deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)",
            opacity: 0.8,
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          animate={{ rotate: [0, 360] }}
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgb(0, 0, 0) 120deg, rgba(0, 0, 0, 0.5) 240deg, transparent 360deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)",
            opacity: 0.9,
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        />

        <motion.div
          animate={{ rotate: [0, -360] }}
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 180deg, transparent 0deg, rgba(0, 0, 0, 0.6) 45deg, transparent 90deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)",
            opacity: 0.35,
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        />

        <motion.div
          animate={{ rotate: [0, 360] }}
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 270deg, transparent 0deg, rgba(0, 0, 0, 0.4) 20deg, transparent 40deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)",
            opacity: 0.5,
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 12 }}
        className={cn("text-center", config.spacing, config.maxWidth)}
        transition={{
          delay: 0.4,
          duration: 1,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 12 }}
          className={cn(
            config.titleClass,
            "text-black/90 leading-tight tracking-tight antialiased dark:text-white/90"
          )}
          transition={{
            delay: 0.6,
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <motion.span
            animate={{ opacity: [0.9, 0.7, 0.9] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: [0.4, 0, 0.6, 1],
            }}
          >
            {title}
          </motion.span>
        </motion.h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 8 }}
          className={cn(
            config.subtitleClass,
            "text-black/60 leading-relaxed tracking-tight antialiased dark:text-white/60"
          )}
          transition={{
            delay: 0.8,
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <motion.span
            animate={{ opacity: [0.6, 0.4, 0.6] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: [0.4, 0, 0.6, 1],
            }}
          >
            {subtitle}
          </motion.span>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Loader;