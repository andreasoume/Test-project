import React, { JSX } from 'react';
import { Field, ImageField, Text, RichText, Image } from '@sitecore-content-sdk/nextjs';

type SkateSpotCardFields = {
  title: Field<string>;
  description: Field<string>;
  image: ImageField;
};

type SkateSpotCardProps = {
  fields: SkateSpotCardFields;
};

const SkateSpotCard = (props: SkateSpotCardProps): JSX.Element => {
  return (
    <article className="p-4 bg-white rounded-2xl shadow-md max-w-sm">
      <div className="mb-4">
        <Image field={props.fields.image} className="rounded-xl" />
      </div>
      <h2 className="text-xl font-bold mb-2 text-gray-800">
        <Text field={props.fields.title} />
      </h2>
      <div className="text-gray-600 text-sm">
        <RichText field={props.fields.description} />
      </div>
    </article>
  );
};

export default SkateSpotCard;
