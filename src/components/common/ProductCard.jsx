import { Link } from "react-router-dom";
import { Heart, Eye, Calendar, Gauge, Battery, Info } from "lucide-react";
import { formatPrice } from "../../utils/formatters";

export const ProductCard = ({ product, onToggleFavorite, isFavorite }) => {
  const primaryImage =
    product.images?.[0] ||
    "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=800";

  // Helper function to get the correct product ID
  const getProductId = (product) => {
    return (
      product?.id ||
      product?.productId ||
      product?.Id ||
      product?.listingId ||
      product?.product_id ||
      null
    );
  };

  const productId = getProductId(product);

  // Debug log
  console.log("ProductCard - Product data:", product);
  console.log("ProductCard - Product ID:", productId);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
      <div className="relative overflow-hidden">
        {product.status === "sold" && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            Đã bán
          </div>
        )}

        {product.is_auction && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            Đấu giá
          </div>
        )}

        <Link to={`/product/${productId}`}>
          <img
            src={primaryImage}
            alt={product.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(productId)}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <Link to={`/product/${productId}`}>
              <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                {product.title}
              </h3>
            </Link>
            <p className="text-sm text-gray-600">
              {product.licensePlate ||
                product.license_plate ||
                product.license ||
                "Biển số: N/A"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          {product.year && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {product.year}
            </div>
          )}
          {product.mileage && (
            <div className="flex items-center">
              <Gauge className="h-4 w-4 mr-1" />
              {product.mileage.toLocaleString()} km
            </div>
          )}
          {product.battery_capacity && (
            <div className="flex items-center">
              <Battery className="h-4 w-4 mr-1" />
              {product.battery_capacity} kWh
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {formatPrice(product.price)}
            </p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Eye className="h-4 w-4 mr-1" />
            {product.views_count || 0}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/product/${productId}`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Info className="h-4 w-4 mr-2" />
            Chi tiết
          </Link>
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(productId)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
