import React from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "../ui/shadcn-io/animated-modal";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

/**
 * Example: Animated Modal for Booking
 *
 * This demonstrates the premium animated modal component
 * with smooth animations and professional styling.
 */
export default function AnimatedModalExample() {
  const bookingDetails = [
    { icon: Calendar, label: "Date", value: "June 15, 2024" },
    { icon: Clock, label: "Time", value: "2:00 PM - 4:00 PM" },
    { icon: MapPin, label: "Location", value: "North Cyprus" },
    { icon: Users, label: "Guests", value: "4 people" },
  ];

  return (
    <div className="py-20 flex items-center justify-center min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <Modal>
        {/* Premium Animated Button Trigger */}
        <ModalTrigger className="bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-lg hover:shadow-xl group/modal-btn">
          <span className="group-hover/modal-btn:translate-x-40 text-center transition duration-500">
            Book Your Experience
          </span>
          <div className="-translate-x-40 group-hover/modal-btn:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 text-white z-20">
            🏖️
          </div>
        </ModalTrigger>

        {/* Modal Content */}
        <ModalBody>
          <ModalContent>
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h4 className="text-3xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent mb-2">
                  Confirm Your Booking
                </h4>
                <p className="text-neutral-500">
                  Review your booking details before confirming
                </p>
              </div>

              {/* Animated Image Gallery */}
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="flex-shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-400 to-cyan-400 shadow-lg">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.1, rotate: 0 }}
                      style={{ rotate: Math.random() * 10 - 5 }}
                    />
                  </div>
                ))}
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-4">
                {bookingDetails.map((detail, idx) => (
                  <div key={detail.label} className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                    >
                      <detail.icon className="w-5 h-5 text-brand-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                          {detail.label}
                        </p>
                        <p className="text-base font-semibold text-neutral-900 dark:text-white">
                          {detail.value}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-50 to-cyan-50 dark:from-brand-900/20 dark:to-cyan-900/20 border border-brand-200 dark:border-brand-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Booking Fee
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    €45.00
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Service Fee
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    €5.00
                  </span>
                </div>
                <div className="h-px bg-neutral-300 dark:bg-neutral-600 my-3" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-cyan-500 bg-clip-text text-transparent">
                    €50.00
                  </span>
                </div>
              </div>
            </div>
          </ModalContent>

          {/* Premium Footer with Gradient Buttons */}
          <ModalFooter className="gap-4">
            <button className="px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-xl text-sm font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              Cancel
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-brand-500 to-cyan-500 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              Confirm Booking
            </button>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </div>
  );
}
