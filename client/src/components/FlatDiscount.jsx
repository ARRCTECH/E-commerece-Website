import { useNavigate } from "react-router-dom";
import discount from "../../public/Trending.png";
const FlatDiscount = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/products"); // Navigates to all products page
  };
  return (
    <div className="w-full  cursor-pointer px-2 mt-1 mb-1" onClick={handleClick}>
      <img
        src={discount} // Image from public folder
        alt="Discount Offer"
        className="w-full h-auto object-cover rounded-xl"
      />
    </div>
  );
};
export default FlatDiscount;