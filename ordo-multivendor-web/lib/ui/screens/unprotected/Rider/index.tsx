// import libraries
import React from 'react';
import { useTranslations } from 'next-intl';

// import components
import Heading from '@/lib/ui/useable-components/RiderandRestaurantsInfos/Heading/Heading';
import RiderRegistrationForm from '@/lib/ui/useable-components/RiderandRestaurantsInfos/RiderRegistrationForm';
import WhyCardsList from '@/lib/ui/useable-components/RiderandRestaurantsInfos/WhyCards/WhyCardsList';
import WhyChoose from '@/lib/ui/useable-components/RiderandRestaurantsInfos/WhyChoose';
import StartingImage from '@/lib/ui/useable-components/RiderandRestaurantsInfos/StartingImage/StartingImage';

// import images
import growth from "@/public/assets/images/png/Growth.png";
import getMoreOrders from "@/public/assets/images/png/GetMoreOrders.png";
import deliverMoreCustomers from "@/public/assets/images/png/deliverToCustomer.png";
import RiderBanner from '@/public/assets/images/png/RidersBanner.png';

const Rider = () => {
  const t = useTranslations();

  const cards = [
    {
      heading: t("enatega_rider_page_name_card1_heading"),
      text: t("enatega_rider_page_name_card1_text"),
      image: growth,
      color: "#f7fbfe",
    },
    {
      heading: t("enatega_rider_page_name_card2_heading"),
      text: t("enatega_rider_page_name_card2_text"),
      image: getMoreOrders,
      color: "#faf7fc",
    },
    {
      heading: t("enatega_rider_page_name_card3_heading"),
      text: t("enatega_rider_page_name_card3_text"),
      image: deliverMoreCustomers,
      color: "#fbfbfb",
    },
  ];

  return (
    <div className="w-screen h-auto">
      <Heading heading={t("enatega_rider_page_name_main_heading")} />
      <StartingImage image={RiderBanner} />
      <WhyChoose
        heading={t("enatega_rider_page_name_why_heading")}
        subHeading={t("enatega_rider_page_name_why_subheading")}
      />
      <WhyCardsList cards={cards} />
      <WhyChoose
        heading={t("enatega_rider_page_name_partner_heading")}
        subHeading={t("enatega_rider_page_name_partner_subheading")}
      />
      <RiderRegistrationForm
        heading={t("enatega_rider_page_name_form_heading")}
        role={t("enatega_rider_page_name_form_role")}
      />
    </div>
  );
};

export default Rider;
