import siteMetadata from '@/data/siteMetadata'
import { getTable } from '../lib/airtable'
import NextImage from 'next/image'
import { PageSeo } from '@/components/SEO'

function Photos({ data }) {
  return (
    <>
      <PageSeo
        title={`Libraries - ${siteMetadata.author}`}
        description={siteMetadata.description}
      />
      <div className="pt-6 pb-8 space-y-2 md:space-y-5">
        <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
          Libraries
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          My open source libraries
        </p>
      </div>
      <div className="c-large mt-10">
        <div className="grid sm:grid-cols-2 gap-10 ">
          {data.map((d) => (
            <div key={d.Id}>
              <NextImage
                src={d.Attachments[0].thumbnails.full.url}
                alt={d.Name}
                width={d.Attachments[0].thumbnails.large.width}
                height={d.Attachments[0].thumbnails.large.height}
                layout="responsive"
              />
              <div className="mt-2">
                <a href={d.url}>
                  <h5 className="font-bold">{d.Name}</h5>
                </a>

                <p className="text-gray-500">{d.Notes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export async function getStaticProps() {
  const data = await getTable('Photos')

  return {
    props: {
      data,
    },
    revalidate: 600,
  }
}
export default Photos
