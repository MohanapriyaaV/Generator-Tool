// import React from 'react'
// import { QuotationA4,QuotationBank,QuotationDetails,QuotationFor,QuotationFrom,QuotationHome,QuotationTable} from '../../context/QuotationContext'

// const Final = () => {
//   return (
    
//   )
// }

// export default Final



import React from "react";
import QuotationA4 from "./QuotationA4";
import QuotationBank from "./QuotationBank";
import QuotationDetails from "./QuotationDetails";
import QuotationFor from "./QuotationFor";
import QuotationFrom from "./QuotationFrom";
import QuotationHome from "./QuotationHome";
import QuotationTable from "./QuotationTable";

const Final = () => {
  return (
    <div>
      {/* <QuotationHome /> */}
      <QuotationFor />
      <QuotationFrom />
      <QuotationDetails />
      <QuotationBank />
      <QuotationTable />
      <QuotationA4 />
    </div>
  );
};

export default Final;
