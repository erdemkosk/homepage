import siteMetadata from '@/data/siteMetadata'
import { getFeed } from '../lib/medium'
import NextImage from 'next/image'
import Link from '@/components/Link'
import Card from '@/components/Card'
import { PageSeo } from '@/components/SEO'
import { convert } from 'html-to-text'

function Photos({ data }) {
  return (
    <>
      <PageSeo title={`Projects - ${siteMetadata.author}`} description={siteMetadata.description} />
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="pt-6 pb-8 space-y-2 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            Medium
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">Medium Makalelerim</p>
        </div>
        <div className="container py-12">
          <div className="flex flex-wrap -m-4">
            {data.map((d) => (
              <Card
                key={d.title}
                title={d.title}
                description={convert(d.content, {
                  wordwrap: 130,
                }).substring(0, 400)}
                imgSrc={d.thumbnail}
                href={d.link}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export async function getStaticProps() {
  const data = await getFeed('erdemkosk')

  return {
    props: {
      data,
    },
    revalidate: 600,
  }
}
export default Photos
