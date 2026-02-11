import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Package, Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProducts, Product } from "@/components/ProductContext";
import { BoxItem } from "@/components/CartContext";
import { cn } from "@/lib/utils";

interface BoxBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  boxProduct: Product;
  onAddToCart: (boxItems: BoxItem[]) => void;
}

interface ItemSelection {
  product: Product;
  count: number;
}

export default function BoxBuilder({ isOpen, onClose, boxProduct, onAddToCart }: BoxBuilderProps) {
  const { products } = useProducts();
  const [selections, setSelections] = useState<Map<string, ItemSelection>>(new Map());

  const boxSize = boxProduct.boxSize || 6;
  const boxCategory = boxProduct.boxCategory || "cookies";

  // Filter products by box category
  const availableItems = useMemo(() => {
    return products.filter(
      (p) => p.category === boxCategory && !p.isBox
    );
  }, [products, boxCategory]);

  // Calculate total selected
  const totalSelected = useMemo(() => {
    let total = 0;
    selections.forEach((sel) => {
      total += sel.count;
    });
    return total;
  }, [selections]);

  const remaining = boxSize - totalSelected;
  const isComplete = totalSelected === boxSize;

  // Reset selections when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelections(new Map());
    }
  }, [isOpen]);

  const handleIncrement = (product: Product) => {
    if (remaining <= 0) return;
    
    setSelections((prev) => {
      const newSelections = new Map(prev);
      const existing = newSelections.get(product.id);
      if (existing) {
        newSelections.set(product.id, { ...existing, count: existing.count + 1 });
      } else {
        newSelections.set(product.id, { product, count: 1 });
      }
      return newSelections;
    });
  };

  const handleDecrement = (productId: string) => {
    setSelections((prev) => {
      const newSelections = new Map(prev);
      const existing = newSelections.get(productId);
      if (existing) {
        if (existing.count <= 1) {
          newSelections.delete(productId);
        } else {
          newSelections.set(productId, { ...existing, count: existing.count - 1 });
        }
      }
      return newSelections;
    });
  };

  const handleAddToCart = () => {
    if (!isComplete) return;
    
    // Convert selections to BoxItem array
    const boxItems: BoxItem[] = [];
    selections.forEach((sel) => {
      for (let i = 0; i < sel.count; i++) {
        boxItems.push({
          id: sel.product.id,
          name: sel.product.name,
        });
      }
    });
    
    onAddToCart(boxItems);
    onClose();
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "cookies": return "Cookie";
      case "cupcakes": return "Cupcake";
      default: return category;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-2xl bg-card rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-caramel/10 to-chocolate/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">
                  Build Your {boxProduct.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose {boxSize} {getCategoryLabel(boxCategory).toLowerCase()}s for your box
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-4 sm:px-6 py-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {totalSelected} of {boxSize} selected
              </span>
              {isComplete ? (
                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Box Complete!
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {remaining} more to go
                </span>
              )}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full transition-colors",
                  isComplete ? "bg-green-500" : "bg-primary"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${(totalSelected / boxSize) * 100}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              />
            </div>
          </div>

          {/* Item Selection Grid */}
          <ScrollArea className="h-[350px] sm:h-[400px]">
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableItems.map((item) => {
                const selection = selections.get(item.id);
                const count = selection?.count || 0;
                const isSelected = count > 0;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {/* Item Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">
                        {item.name}
                      </h3>
                      {isSelected && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-primary font-medium"
                        >
                          {count} in box
                        </motion.p>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          onClick={() => handleDecrement(item.id)}
                          className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => handleIncrement(item)}
                        disabled={remaining <= 0}
                        className={cn(
                          "p-1.5 rounded-full transition-colors",
                          remaining > 0
                            ? "bg-primary text-white hover:bg-primary/90"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                        whileTap={remaining > 0 ? { scale: 0.9 } : {}}
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Selected Items Summary */}
          {totalSelected > 0 && (
            <div className="px-4 sm:px-6 py-3 border-t bg-muted/20">
              <p className="text-sm text-muted-foreground mb-2">Your selection:</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selections.values()).map((sel) => (
                  <span
                    key={sel.product.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium"
                  >
                    {sel.product.name}
                    {sel.count > 1 && <span className="text-primary/70">×{sel.count}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-t bg-card">
            <div>
              <p className="text-lg font-bold text-foreground">
                ${boxProduct.price.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Box price</p>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={!isComplete}
              className={cn(
                "gap-2 px-6",
                isComplete
                  ? "bg-primary hover:bg-primary/90 text-white"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              {isComplete ? "Add to Cart" : `Select ${remaining} more`}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
